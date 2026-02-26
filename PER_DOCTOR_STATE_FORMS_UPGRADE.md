# Per-Doctor State-Specific PDF Forms Enhancement

This document explains how to upgrade a project from a single global PDF form per doctor to per-state PDF forms on the doctor profile. This allows each doctor to have different PDF forms for different states, so when a patient from a specific state is approved, the correct state-specific form is auto-filled.

---

## Overview

**Before**: Each doctor had one `gizmoFormUrl` field — a single PDF form used for all patients regardless of state.

**After**: Each doctor has a `stateForms` object (e.g., `{ "Oklahoma": "url1", "Texas": "url2" }`) stored on their profile. When a patient's application is processed, the system matches the patient's state to the doctor's state-specific form. The old `gizmoFormUrl` field still works as a fallback.

**Resolution order**: `doctorProfile.stateForms[patientState]` → `doctorProfile.gizmoFormUrl` (fallback)

---

## Changes Required

### 1. Doctor Profile Data Model (Firestore)

Add the `stateForms` field to the doctor profile document. It's an object where keys are full state names and values are PDF URLs.

```
doctorProfiles/{id}:
  ...existing fields...
  stateForms: {
    "Oklahoma": "https://storage.googleapis.com/.../oklahoma-form.pdf",
    "Texas": "https://storage.googleapis.com/.../texas-form.pdf"
  }
  gizmoFormUrl: "https://..."  // kept as fallback
```

No schema migration needed — Firestore is schemaless. Just start writing the field.

### 2. Backend: Doctor Profile Create Endpoint

In the `POST /api/doctor-profiles` route, add `stateForms` to the destructured body and include it in `profileData`:

```typescript
const { ..., stateForms, userId: bodyUserId } = req.body;
// ...
if (stateForms !== undefined) profileData.stateForms = stateForms;
```

### 3. Backend: Doctor Profile Update Endpoint

In the `PUT /api/doctor-profiles/:id` route, add `stateForms` to the destructured body and include it in `updateData`:

```typescript
const { ..., stateForms } = req.body;
// ...
if (stateForms !== undefined) updateData.stateForms = stateForms;
```

### 4. Backend: Form Data Resolution

In the `GET /api/forms/data/:applicationId` endpoint, change the PDF URL resolution to check `doctorProfile.stateForms` first:

**Before** (if you had a separate stateFormTemplates collection):
```typescript
const patientState = formData.state || patient?.state || "";
if (patientState) {
  const stateTemplate = await storage.getStateFormTemplate(patientState);
  if (stateTemplate?.gizmoFormUrl) {
    gizmoFormUrl = stateTemplate.gizmoFormUrl;
  }
}
if (!gizmoFormUrl && doctorProfile?.gizmoFormUrl) {
  gizmoFormUrl = doctorProfile.gizmoFormUrl;
}
```

**After** (per-doctor state forms):
```typescript
const patientState = formData.state || patient?.state || "";
if (patientState && doctorProfile?.stateForms) {
  const stateFormUrl = (doctorProfile.stateForms as Record<string, string>)[patientState];
  if (stateFormUrl) {
    gizmoFormUrl = stateFormUrl;
  }
}
if (!gizmoFormUrl && doctorProfile?.gizmoFormUrl) {
  gizmoFormUrl = doctorProfile.gizmoFormUrl;
}
```

### 5. Frontend: Doctor Profile Modal (UserProfileModal.tsx)

#### a. Add state variables

```typescript
const [selectedPdfState, setSelectedPdfState] = useState<string>("");
const [previewPdfState, setPreviewPdfState] = useState<string>("");
```

#### b. Initialize `stateForms` in doctor profile data

When loading an existing profile:
```typescript
stateForms: doctorProfile.stateForms || {},
```

When creating a new profile:
```typescript
stateForms: {},
```

#### c. Replace the PDF section

Replace the old single-PDF section (the `gizmoFormUrl` card with Preview & Remove) with the new per-state system. The UI has three parts:

**Part 1 — State form list** (green cards): Shows all assigned state→PDF mappings. Each card has the state name, Preview & Fill button, and Remove button.

```tsx
{Object.keys(doctorProfileData.stateForms || {}).length > 0 && (
  <div className="space-y-2">
    {Object.entries(doctorProfileData.stateForms).map(([st, url]) => (
      <div key={st} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">{st}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setPreviewPdfState(st); setShowGizmoPreview(true); }}>
              <FileText className="h-3 w-3 mr-1" /> Preview & Fill
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
              const updated = { ...doctorProfileData.stateForms };
              delete updated[st];
              setDoctorProfileData({ ...doctorProfileData, stateForms: updated });
            }}>
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{url.split("/").pop()}</p>
      </div>
    ))}
  </div>
)}
```

**Part 2 — Uploaded PDF with state assignment dropdown** (amber card): After uploading a PDF, shows it with a state dropdown. Admin picks a state to assign the PDF. The card stays visible so the same PDF can be assigned to multiple states.

```tsx
{doctorProfileData.gizmoFormUrl && (
  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm text-amber-700 dark:text-amber-300">Uploaded PDF</span>
      <Button variant="ghost" size="sm" className="text-destructive"
        onClick={() => setDoctorProfileData({ ...doctorProfileData, gizmoFormUrl: "" })}>
        <Trash2 className="h-3 w-3 mr-1" /> Clear
      </Button>
    </div>
    <p className="text-xs text-muted-foreground mt-1 truncate">{doctorProfileData.gizmoFormUrl.split("/").pop()}</p>
    <Select value={selectedPdfState} onValueChange={(val) => {
      const updated = { ...doctorProfileData.stateForms, [val]: doctorProfileData.gizmoFormUrl };
      setDoctorProfileData({ ...doctorProfileData, stateForms: updated });
      setSelectedPdfState("");
    }}>
      <SelectTrigger className="mt-2"><SelectValue placeholder="Assign to state..." /></SelectTrigger>
      <SelectContent>
        {ALL_STATES.filter(s => !doctorProfileData.stateForms[s]).map(st => (
          <SelectItem key={st} value={st}>{st}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

**Part 3 — Upload button**: Same as before, uploads to the existing gizmo-form endpoint.

#### d. Update the Preview dialog

Change the preview dialog to use the state-specific URL when previewing a state form:

```tsx
gizmoFormUrl: previewPdfState
  ? (doctorProfileData.stateForms || {})[previewPdfState]
  : doctorProfileData.gizmoFormUrl,
```

### 6. Remove Old State Forms Infrastructure (if applicable)

If you previously had a separate `stateFormTemplates` Firestore collection and admin State Forms management page:

- Delete the `StateFormsManagement.tsx` page
- Remove its routes from `App.tsx`
- Remove its nav items from `DashboardLayout.tsx`
- Remove the API endpoints (`/api/admin/state-forms/*`) from `routes.ts`
- Remove the storage methods (`getStateFormTemplates`, `getStateFormTemplate`, `upsertStateFormTemplate`) from `storage.ts`

---

## User Workflow

1. Admin opens a doctor's profile modal, goes to the "Doctor" tab
2. Uploads a PDF form using "Choose PDF File"
3. An amber "Uploaded PDF" card appears with a state dropdown
4. Admin selects a state (e.g., "Oklahoma") — the PDF is assigned and appears as a green card
5. To add the same PDF for another state, admin picks another state from the dropdown
6. To add a different PDF for a different state, admin uploads a new PDF and assigns it
7. Admin clicks "Update Doctor Profile" then "Save Changes" to persist

When a patient from Oklahoma gets approved, the system uses the Oklahoma-specific form for that doctor. If no state-specific form exists, it falls back to the doctor's general `gizmoFormUrl`.
