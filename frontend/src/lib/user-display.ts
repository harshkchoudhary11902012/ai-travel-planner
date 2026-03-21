export type AuthenticatedUser = {
	email: string;
	firstName?: string;
	lastName?: string;
};

/** Full name when first/last exist; otherwise a friendly label from email. */
export function displayFullName(user: AuthenticatedUser): string {
	const fn = user.firstName?.trim() ?? "";
	const ln = user.lastName?.trim() ?? "";
	if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
	return displayFirstNameFromEmail(user.email);
}

export function displayFirstNameFromEmail(email: string): string {
	const local = email.split("@")[0]?.trim() ?? "";
	const token = local.split(/[._-]+/)[0] || local;
	if (!token) return "User";
	return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function avatarInitialsFromEmail(email: string): string {
	const name = displayFirstNameFromEmail(email);
	return name.length >= 2
		? name.slice(0, 2).toUpperCase()
		: name.slice(0, 1).toUpperCase() || "?";
}

export function avatarInitialsFromUser(user: AuthenticatedUser): string {
	const fn = user.firstName?.trim() ?? "";
	const ln = user.lastName?.trim() ?? "";
	if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
	if (fn.length >= 2) return fn.slice(0, 2).toUpperCase();
	if (fn.length === 1) return fn[0].toUpperCase();
	return avatarInitialsFromEmail(user.email);
}
