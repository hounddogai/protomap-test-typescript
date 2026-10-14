import { FallbackDomainPolicy } from "./fallback-domain-policy.js";

/** How screens and exports show a fallback domain policy. */
export class FallbackDomainPolicyView {
  code: string;
  name: string;
  attempts: string;
  archived: string;
  checksumText: string;
  startsAtText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    archived: string,
    checksumText: string,
    startsAtText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.archived = archived;
    this.checksumText = checksumText;
    this.startsAtText = startsAtText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackDomainPolicyView(item: FallbackDomainPolicy): FallbackDomainPolicyView {
  return new FallbackDomainPolicyView(
    item.code,
    item.name,
    String(item.attempts),
    `${item.archived}`,
    item.checksum,
    String(item.startsAt),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackDomainPolicyViews(items: FallbackDomainPolicy[]): FallbackDomainPolicyView[] {
  const views: FallbackDomainPolicyView[] = [];
  for (const item of items) {
    views.push(toFallbackDomainPolicyView(item));
  }
  return views;
}

export function sumFallbackDomainPolicyView(view: FallbackDomainPolicyView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedAttempts + parsedStartsAt;
}
