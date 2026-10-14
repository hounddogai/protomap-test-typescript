import * as text from "../../../../kit/text.js";

/** Where a redemption bundle is in its life cycle. */
export type RedemptionBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A redemption bundle as the redemption team keeps it. */
export class RedemptionBundle {
  code: string;
  title: string;
  segment: string;
  maximum: number;
  name: string;
  status: RedemptionBundleStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    maximum: number,
    name: string,
    status: RedemptionBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.maximum = maximum;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): RedemptionBundle {
    return new RedemptionBundle(this.code, this.title, this.segment, this.maximum, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a redemption bundle in status requested. */
export function newRedemptionBundle(code: string, title: string): RedemptionBundle {
  return new RedemptionBundle(code, title, "", 0, "", "requested");
}
