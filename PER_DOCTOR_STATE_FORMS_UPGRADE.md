# Full Platform Upgrade Guide

This document covers all enhancements needed to upgrade another project to match this platform's features:

1. **Per-Doctor State-Specific PDF Forms** — each doctor can have different PDF forms per state
2. **Package Radio Button Fields with 1-to-1 PDF Mapping** — admin defines radio options that map directly to PDF radio buttons
3. **Patient Draft Save to Firestore** — patients can save progress and come back later
4. **Manual Payment Draft Integration** — admin manual payment pulls in patient's saved answers

---

## Part 1: Per-Doctor State-Specific PDF Forms

### Overview

**Before**: Each doctor had one `gizmoFormUrl` field — a single PDF form used for all patients regardless of state.

**After**: Each doctor has a `stateForms` object (e.g., `{ "Oklahoma": "url1", "Texas": "url2" }`) stored on their profile. When a patient's application is processed, the system matches the patient's state to the doctor's state-specific form. The old `gizmoFormUrl` field still works as a fallback.

**Resolution order**: `doctorProfile.stateForms[patientState]` → `doctorProfile.gizmoFormUrl` (fallback)

### 1.1 Doctor Profile Data Model (Firestore)

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

### 1.2 Backend: Doctor Profile Create Endpoint

In the `POST /api/doctor-profiles` route, add `stateForms` to the destructured body and include it in `profileData`:

```typescript
const { ..., stateForms, userId: bodyUserId } = req.body;
// ...
if (stateForms !== undefined) profileData.stateForms = stateForms;
```

### 1.3 Backend: Doctor Profile Update Endpoint

In the `PUT /api/doctor-profiles/:id` route, add `stateForms` to the destructured body and include it in `updateData`:

```typescript
const { ..., stateForms } = req.body;
// ...
if (stateForms !== undefined) updateData.stateForms = stateForms;
```

### 1.4 Backend: Form Data Resolution

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

### 1.5 Frontend: Doctor Profile Modal (UserProfileModal.tsx)

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

### 1.6 Remove Old State Forms Infrastructure (if applicable)

If you previously had a separate `stateFormTemplates` Firestore collection and admin State Forms management page:

- Delete the `StateFormsManagement.tsx` page
- Remove its routes from `App.tsx`
- Remove its nav items from `DashboardLayout.tsx`
- Remove the API endpoints (`/api/admin/state-forms/*`) from `routes.ts`
- Remove the storage methods (`getStateFormTemplates`, `getStateFormTemplate`, `upsertStateFormTemplate`) from `storage.ts`

---

## Part 2: Package Radio Button Fields with 1-to-1 PDF Mapping

### Overview

Admins define radio button fields on packages where each option has a **Radio ID** (the exact PDF radio button number) and a **Statement** (the text the patient sees). When the patient picks a statement, the radio ID is stored. The GizmoForm then checks the exact matching radio button on the PDF.

**How it works:**
1. Admin creates a radio field on a package, adds options like: `Radio ID: 7` / `Statement: "Cannot walk 200 feet without stopping"`
2. Patient sees the statement as a clickable card, selects it → the value `"7"` is stored
3. Backend collects all selected radio IDs into a `selectedRadioIds` array
4. GizmoForm checks `selectedRadioIds` against PDF `{radio_id_N}` placeholders

### 2.1 Form Field Schema (PackagesManagement.tsx)

Update the form field Zod schema to include `radioOptions`:

```typescript
const formFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "select", "date", "email", "phone", "number", "radio"]),
  required: z.boolean().default(true),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  radioOptions: z.array(z.object({
    radioId: z.string(),
    text: z.string(),
  })).optional(),
});
```

### 2.2 Admin UI: Radio Option Editor (PackagesManagement.tsx)

When `field.type === "radio"`, render rows with Radio ID + Statement inputs instead of a comma-separated options input. Each row maps directly to one PDF radio button.

Replace the old radio/select options input:
```tsx
{(field.type === "select" || field.type === "radio") && (
  <Input
    placeholder="Options (comma-separated)"
    value={(field.options || []).join(", ")}
    onChange={(e) => updateFormField(index, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
  />
)}
```

With separate handling for select vs radio:
```tsx
{field.type === "select" && (
  <Input
    placeholder="Options (comma-separated)"
    value={(field.options || []).join(", ")}
    onChange={(e) => updateFormField(index, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
    data-testid={`input-field-options-${index}`}
  />
)}
{field.type === "radio" && (
  <div className="space-y-2 pt-1">
    <p className="text-xs text-muted-foreground">Each option maps to a specific radio button on the PDF. Enter just the number (e.g. 1, 2, 7) and the statement the patient will see.</p>
    {(field.radioOptions || []).map((ro, roIdx) => (
      <div key={roIdx} className="flex items-center gap-2">
        <Input
          placeholder="e.g. 1"
          value={ro.radioId}
          onChange={(e) => {
            const updated = [...(field.radioOptions || [])];
            updated[roIdx] = { ...updated[roIdx], radioId: e.target.value };
            updateFormField(index, { radioOptions: updated });
          }}
          className="w-24 flex-shrink-0"
          data-testid={`input-radio-id-${index}-${roIdx}`}
        />
        <Input
          placeholder="Statement shown to patient"
          value={ro.text}
          onChange={(e) => {
            const updated = [...(field.radioOptions || [])];
            updated[roIdx] = { ...updated[roIdx], text: e.target.value };
            updateFormField(index, { radioOptions: updated });
          }}
          className="flex-1"
          data-testid={`input-radio-text-${index}-${roIdx}`}
        />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => {
          const updated = (field.radioOptions || []).filter((_, i) => i !== roIdx);
          updateFormField(index, { radioOptions: updated });
        }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={() => {
      const updated = [...(field.radioOptions || []), { radioId: "", text: "" }];
      updateFormField(index, { radioOptions: updated });
    }} data-testid={`button-add-radio-option-${index}`}>
      <Plus className="h-3 w-3 mr-1" /> Add Option
    </Button>
  </div>
)}
```

### 2.3 Patient-Facing Radio UI (NewApplication.tsx)

Update the radio rendering to handle the new `radioOptions` format. When `radioOptions` is present, show the text but store the `radioId` as the value. Keep the old `options` format as fallback for backward compatibility.

Replace the radio rendering block:
```tsx
) : field.type === "radio" ? (
  <div className="space-y-2 pt-1" data-testid={`radio-group-${field.name}`}>
    {field.radioOptions && field.radioOptions.length > 0 ? (
      field.radioOptions.map((ro: any) => (
        <label key={ro.radioId} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${customFields[field.name] === ro.radioId ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
          <input
            type="radio"
            name={field.name}
            value={ro.radioId}
            checked={customFields[field.name] === ro.radioId}
            onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
            className="h-4 w-4 text-primary"
            data-testid={`radio-${field.name}-${ro.radioId}`}
          />
          <span className="text-sm">{ro.text}</span>
        </label>
      ))
    ) : (field.options || []).map((opt: string) => (
      <label key={opt} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${customFields[field.name] === opt ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
        <input
          type="radio"
          name={field.name}
          value={opt}
          checked={customFields[field.name] === opt}
          onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
          className="h-4 w-4 text-primary"
          data-testid={`radio-${field.name}-${opt.toLowerCase().replace(/\s+/g, "_")}`}
        />
        <span className="text-sm">{opt}</span>
      </label>
    ))}
  </div>
```

### 2.4 Backend: Collect Selected Radio IDs (routes.ts)

In the `GET /api/forms/data/:applicationId` endpoint, after building `patientData` and `doctorData`, add code to collect the selected radio IDs from fields that have `radioOptions`. Add this before the response `result` object:

```typescript
const selectedRadioIds: string[] = [];
const pkgFormFields = (pkg as any)?.formFields || (pkg as any)?.requiredFields || [];
if (Array.isArray(pkgFormFields)) {
  for (const field of pkgFormFields as any[]) {
    if (field.radioOptions && Array.isArray(field.radioOptions)) {
      const val = formData[field.name];
      if (val) {
        selectedRadioIds.push(String(val));
      }
    }
  }
}

const result: any = {
  success: true,
  patientData,
  doctorData,
  gizmoFormUrl,
  generatedDate,
  patientName: `${patientData.firstName} ${patientData.lastName}`.trim(),
  applicationId: application.id,
  packageName: pkg?.name || "Service",
  selectedRadioIds,  // <-- ADD THIS
};
```

**Important**: Use `formFields` (the Firestore field name). Some projects may use `requiredFields` — the code above checks both to be safe.

### 2.5 GizmoForm: Use selectedRadioIds (GizmoForm.tsx)

#### a. Update the GizmoFormData interface

Add `selectedRadioIds` to the data interface:

```typescript
export interface GizmoFormData {
  success: boolean;
  gizmoFormLayout?: "A" | "B";
  patientData: Record<string, string>;
  doctorData: Record<string, string>;
  gizmoFormUrl: string | null;
  generatedDate: string;
  patientName: string;
  selectedRadioIds?: string[];  // <-- ADD THIS
}
```

#### b. Build the set from API data

At the top of `extractPlaceholdersFromPdf`, create the set from the API response (NOT from scanning all patient data values):

```typescript
const extractPlaceholdersFromPdf = async (pdf: pdfjsLib.PDFDocumentProxy) => {
  const fields: PlaceholderField[] = [];
  const radios: RadioField[] = [];
  const selectedRadioIds = new Set(data.selectedRadioIds || []);  // <-- ADD THIS
  // ... rest of function
```

#### c. Update both auto-fill blocks

In both places where radio selection is determined (there are two — one for the regex match path and one for the `addRadioFromItem` helper), add `selectedRadioIds.has(option)` as the first check before the existing `RADIO_AUTO_FILL` lookup:

**Before:**
```typescript
let selected = false;
const autoFill = RADIO_AUTO_FILL[group];
if (autoFill) {
  const patientVal = String(data.patientData[autoFill.sourceField] || "");
  const lowerVal = patientVal.toLowerCase();
  const normalizedVal = lowerVal.replace(/[\s-]+/g, "_");
  const expectedOption = autoFill.valueMap[patientVal] || autoFill.valueMap[lowerVal] || autoFill.valueMap[normalizedVal];
  if (expectedOption === option) {
    selected = true;
  }
}
```

**After:**
```typescript
let selected = selectedRadioIds.has(option);
if (!selected) {
  const autoFill = RADIO_AUTO_FILL[group];
  if (autoFill) {
    const patientVal = String(data.patientData[autoFill.sourceField] || "");
    const lowerVal = patientVal.toLowerCase();
    const normalizedVal = lowerVal.replace(/[\s-]+/g, "_");
    const expectedOption = autoFill.valueMap[patientVal] || autoFill.valueMap[lowerVal] || autoFill.valueMap[normalizedVal];
    if (expectedOption === option) {
      selected = true;
    }
  }
}
```

The `selectedRadioIds` check runs first. If the radio ID was directly selected by the patient (via the new 1-to-1 mapping), it matches immediately. The old `RADIO_AUTO_FILL` value map lookup only runs as a fallback for legacy field formats.

---

## Part 3: Patient Draft Save to Firestore

### Overview

Patients can start filling out the application wizard, leave, and come back later — their progress is saved to Firestore on their user profile. This also enables the manual payment flow to pull in their answers.

**Data stored**: `draftFormData` object on the user document in Firestore containing:
- `packageId` — selected package
- `disabilityCondition` — selected condition
- `reason` — text reason
- `additionalInfo` — optional notes
- `customFields` — all radio button selections and other custom field answers
- `step` — current wizard step number

### 3.1 Backend: Draft Form Endpoints (routes.ts)

Add two new endpoints after the profile update route (`PUT /api/profile`):

```typescript
app.get("/api/profile/draft-form", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    res.json({ draftFormData: (user as any)?.draftFormData || {} });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/profile/draft-form", requireAuth, async (req, res) => {
  try {
    await storage.updateUser(req.user!.id, { draftFormData: req.body.draftFormData || {} } as any);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

No schema changes needed — Firestore stores the `draftFormData` object directly on the user document.

### 3.2 Frontend: Auto-Save and Restore (NewApplication.tsx)

#### a. Add imports

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
```

#### b. Add draft loading query

After the `useForm` setup, add:

```typescript
const { data: draftData, isLoading: draftLoading } = useQuery<{ draftFormData: Record<string, any> }>({
  queryKey: ["/api/profile/draft-form"],
});
```

#### c. Restore draft on load

```typescript
const draftLoaded = useRef(false);
useEffect(() => {
  if (draftData?.draftFormData && !draftLoaded.current) {
    draftLoaded.current = true;
    const draft = draftData.draftFormData;
    if (draft.packageId && !preselectedPackage) form.setValue("packageId", draft.packageId);
    if (draft.disabilityCondition) form.setValue("disabilityCondition", draft.disabilityCondition);
    if (draft.reason) form.setValue("reason", draft.reason);
    if (draft.additionalInfo) form.setValue("additionalInfo", draft.additionalInfo);
    if (draft.customFields) setCustomFields(draft.customFields);
    if (draft.step && draft.step > 1) setStep(draft.step);
  }
}, [draftData]);
```

#### d. Auto-save on changes (debounced 1 second)

```typescript
const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const saveDraft = useCallback(() => {
  if (saveTimer.current) clearTimeout(saveTimer.current);
  saveTimer.current = setTimeout(() => {
    const values = form.getValues();
    const draftFormData = {
      packageId: values.packageId,
      disabilityCondition: values.disabilityCondition,
      reason: values.reason,
      additionalInfo: values.additionalInfo,
      customFields,
      step,
    };
    apiRequest("PUT", "/api/profile/draft-form", { draftFormData }).catch(() => {});
  }, 1000);
}, [customFields, step]);

useEffect(() => {
  if (draftLoaded.current) saveDraft();
}, [customFields, step, saveDraft]);

const watchedValues = form.watch();
useEffect(() => {
  if (draftLoaded.current) saveDraft();
}, [watchedValues.packageId, watchedValues.disabilityCondition, watchedValues.reason, watchedValues.additionalInfo]);
```

#### e. Clear draft on successful submission

In the `onSuccess` callback of the `createApplication` mutation, add:

```typescript
onSuccess: (application) => {
  queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
  apiRequest("PUT", "/api/profile/draft-form", { draftFormData: {} }).catch(() => {});
  queryClient.invalidateQueries({ queryKey: ["/api/profile/draft-form"] });
  // ... rest of success handler (toast, redirect)
},
```

---

## Part 4: Manual Payment Draft Integration

### Overview

When an admin processes a manual payment for a patient, the system pulls in the patient's saved draft answers (radio button selections, disability condition, etc.) into the application's `formData`. This means:
- Patient answers their questions at any time
- Admin processes manual payment later
- The application automatically includes all patient answers
- Those answers flow through to PDF auto-fill

### 4.1 Backend: Pull Draft into Manual Payment (routes.ts)

In the `POST /api/admin/users/:userId/manual-payment` endpoint, before creating the application, pull the draft data from the user's profile:

**Before:**
```typescript
const application = await storage.createApplication({
  userId: targetUser.id,
  packageId,
  currentStep: 1,
  totalSteps: workflowSteps.length,
  status: "pending",
  formData: {
    manualPayment: true,
    manualPaymentReason: reason || "Manual payment by admin",
    manualPaymentBy: `${req.user!.firstName} ${req.user!.lastName}`,
    manualPaymentAt: new Date().toISOString(),
    fullName: `${targetUser.firstName} ${targetUser.lastName}`,
    firstName: targetUser.firstName,
    lastName: targetUser.lastName,
    email: targetUser.email,
    phone: targetUser.phone || "",
    dateOfBirth: targetUser.dateOfBirth || "",
    address: targetUser.address || "",
    city: targetUser.city || "",
    state: targetUser.state || "",
    zipCode: targetUser.zipCode || "",
  },
  paymentStatus: "paid",
  paymentAmount: pkg.price,
});
```

**After:**
```typescript
const draftData = (targetUser as any).draftFormData || {};
const draftCustomFields = draftData.customFields || {};

const application = await storage.createApplication({
  userId: targetUser.id,
  packageId: draftData.packageId || packageId,
  currentStep: 1,
  totalSteps: workflowSteps.length,
  status: "pending",
  formData: {
    manualPayment: true,
    manualPaymentReason: reason || "Manual payment by admin",
    manualPaymentBy: `${req.user!.firstName} ${req.user!.lastName}`,
    manualPaymentAt: new Date().toISOString(),
    fullName: `${targetUser.firstName} ${targetUser.lastName}`,
    firstName: targetUser.firstName,
    lastName: targetUser.lastName,
    email: targetUser.email,
    phone: targetUser.phone || "",
    dateOfBirth: targetUser.dateOfBirth || "",
    address: targetUser.address || "",
    city: targetUser.city || "",
    state: targetUser.state || "",
    zipCode: targetUser.zipCode || "",
    disabilityCondition: draftData.disabilityCondition || "",
    reason: draftData.reason || "",
    additionalInfo: draftData.additionalInfo || "",
    ...draftCustomFields,
  },
  paymentStatus: "paid",
  paymentAmount: pkg.price,
});
```

Key changes:
- `draftData` is read from `targetUser.draftFormData`
- `draftCustomFields` contains all the radio button selections (stored by field name → radio ID)
- `...draftCustomFields` spreads them into formData so they're available for PDF auto-fill
- `draftData.packageId` is used as a fallback if the admin didn't select a different package

### 4.2 Clear Draft After Manual Payment

After the application is created and steps are set up, clear the patient's draft:

```typescript
await storage.updateUser(targetUser.id, { draftFormData: {} } as any);
```

---

## Complete Data Flow Summary

1. **Admin** creates a package with radio fields: each option has a radio ID number and a statement
2. **Patient** opens the application wizard → draft is loaded from Firestore if they have one
3. **Patient** selects a package, answers radio questions → each answer saves the radio ID (e.g., `"7"`)
4. **Patient** progress auto-saves to Firestore every second (debounced)
5. **Patient** can close browser and come back — everything is restored
6. **Patient submits** (or **Admin does manual payment**) → application created with all answers in `formData`
7. **Doctor reviews** and approves via token link → document auto-generated
8. **Patient views PDF** on dashboard → `GET /api/forms/data/:applicationId` runs:
   - Resolves PDF URL: `doctorProfile.stateForms[patientState]` → `doctorProfile.gizmoFormUrl` fallback
   - Collects `selectedRadioIds` from fields with `radioOptions` definitions
   - Returns `selectedRadioIds` array in response
9. **GizmoForm** scans the PDF for `{radio_id_N}` placeholders:
   - First checks if `N` is in the `selectedRadioIds` set (direct 1-to-1 match)
   - Falls back to `RADIO_AUTO_FILL` value map lookup (legacy support)
   - Checks the matching radio button on the PDF

---

## Files Modified (Summary)

| File | Changes |
|------|---------|
| `server/routes.ts` | Draft form endpoints, selectedRadioIds collection, manual payment draft integration, per-doctor state form resolution |
| `server/storage.ts` | Doctor profile stateForms field in create/update |
| `client/src/pages/dashboard/admin/PackagesManagement.tsx` | radioOptions schema, radio ID + statement editor UI |
| `client/src/pages/dashboard/applicant/NewApplication.tsx` | Draft load/save, radioOptions rendering, draft clear on submit |
| `client/src/components/GizmoForm.tsx` | selectedRadioIds interface field, Set-based direct matching before RADIO_AUTO_FILL fallback |
| `client/src/components/shared/UserProfileModal.tsx` | stateForms UI (green cards, amber upload card, state dropdown) |
