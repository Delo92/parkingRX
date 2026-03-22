const WEBHOOK_URL = "https://chronicbrandsusa.com/api/webhooks/promo-redemption";
const BRAND_NAME = "ParkingRx";
const PLATFORM = "ParkingRx Website";

interface PromoRedemptionData {
  code: string;
  orderNumber: string;
  orderValue: string;
  discountAmount?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export async function trackPromoRedemption(data: PromoRedemptionData): Promise<{ success: boolean; message?: string }> {
  const apiKey = process.env.PROMO_API_KEY;
  if (!apiKey) {
    console.warn("PROMO_API_KEY not set — skipping promo tracking");
    return { success: false, message: "PROMO_API_KEY not configured" };
  }
  if (!data.code || !data.code.trim()) {
    return { success: false, message: "No promo code provided" };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        code: data.code.trim().toUpperCase(),
        brandName: BRAND_NAME,
        platform: PLATFORM,
        orderNumber: data.orderNumber,
        orderValue: data.orderValue,
        discountAmount: data.discountAmount || "0",
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        notes: data.notes || `Order completed at ${new Date().toISOString()}`,
      }),
    });

    const result = await response.json() as any;

    if (!response.ok || !result.valid) {
      const msg = result.message || `Promo code rejected (HTTP ${response.status})`;
      console.warn("Promo tracking rejected:", msg);
      return { success: false, message: msg };
    }

    console.log(`Promo code ${data.code} tracked successfully — redemption ID: ${result.redemption?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error("Promo tracking webhook failed (non-blocking):", err.message);
    return { success: false, message: err.message };
  }
}
