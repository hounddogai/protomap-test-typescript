import * as text from "../../../../kit/text.js";

/** Where a primary payout manifest is in its life cycle. */
export type PrimaryPayoutManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary payout manifest as the payout team keeps it. */
export class PrimaryPayoutManifest {
  code: string;
  name: string;
  unit: string;
  variant: string;
  checksum: string;
  pinned: boolean;
  score: number;
  locale: string;
  country: string;
  category: string;
  status: PrimaryPayoutManifestStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    variant: string,
    checksum: string,
    pinned: boolean,
    score: number,
    locale: string,
    country: string,
    category: string,
    status: PrimaryPayoutManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.variant = variant;
    this.checksum = checksum;
    this.pinned = pinned;
    this.score = score;
    this.locale = locale;
    this.country = country;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryPayoutManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPayoutManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary payout manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary payout manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimaryPayoutManifest {
    return new PrimaryPayoutManifest(
      this.code,
      this.name,
      this.unit,
      this.variant,
      this.checksum,
      this.pinned,
      this.score,
      this.locale,
      this.country,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary payout manifest in status proposed. */
export function newPrimaryPayoutManifest(code: string, name: string): PrimaryPayoutManifest {
  return new PrimaryPayoutManifest(code, name, "", "", "", false, 0, "", "", "", "proposed");
}
