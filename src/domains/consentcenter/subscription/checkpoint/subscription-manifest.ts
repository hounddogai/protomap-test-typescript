import * as text from "../../../../kit/text.js";

/** Where a subscription manifest is in its life cycle. */
export type SubscriptionManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One subscription manifest, with what the planners need to act on it. */
export class SubscriptionManifest {
  code: string;
  label: string;
  quantity: number;
  locale: string;
  clicks: number;
  category: string;
  maximum: number;
  status: SubscriptionManifestStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    locale: string,
    clicks: number,
    category: string,
    maximum: number,
    status: SubscriptionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.locale = locale;
    this.clicks = clicks;
    this.category = category;
    this.maximum = maximum;
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

  canMoveTo(next: SubscriptionManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SubscriptionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"subscription manifest"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.quantity - this.clicks) * 100) / 100;
  }

  copy(): SubscriptionManifest {
    return new SubscriptionManifest(
      this.code,
      this.label,
      this.quantity,
      this.locale,
      this.clicks,
      this.category,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription manifest in status proposed. */
export function newSubscriptionManifest(code: string, label: string): SubscriptionManifest {
  return new SubscriptionManifest(code, label, 0, "", 0, "", 0, "proposed");
}
