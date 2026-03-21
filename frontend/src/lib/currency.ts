const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0,
});

/**
 * API / LLM amounts are on a USD-like scale. Displayed INR = raw × this rate.
 */
export const RAW_AMOUNT_TO_INR = 90;

/** Format a value already in whole rupees (e.g. ₹1,23,456). */
export function formatINR(amountInRupees: number): string {
	return inr.format(Math.round(amountInRupees));
}

/** Convert raw stored amount to rupees (× {@link RAW_AMOUNT_TO_INR}) and format. */
export function formatCostInINR(rawAmount: number): string {
	return formatINR(rawAmount * RAW_AMOUNT_TO_INR);
}
