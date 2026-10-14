import * as text from "../../../../kit/text.js";

/** Where a default funnel manifest is in its life cycle. */
export type DefaultFunnelManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default funnel manifest as the funnel team keeps it. */
export class DefaultFunnelManifest {
  code: string;
  name: string;
  expiresAt: number;
  variant: string;
  amount: number;
  contactEmail: string;
  durationMinutes: number;
  status: DefaultFunnelManifestStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    variant: string,
    amount: number,
    contactEmail: string,
    durationMinutes: number,
    status: DefaultFunnelManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultFunnelManifestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultFunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default funnel manifest"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.expiresAt * this.durationMinutes * 100) / 100;
  }

  copy(): DefaultFunnelManifest {
    return new DefaultFunnelManifest(
      this.code,
      this.name,
      this.expiresAt,
      this.variant,
      this.amount,
      this.contactEmail,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default funnel manifest in status open. */
export function newDefaultFunnelManifest(code: string, name: string): DefaultFunnelManifest {
  return new DefaultFunnelManifest(code, name, 0, "", 0, "", 0, "open");
}
