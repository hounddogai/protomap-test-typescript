import * as text from "../../../../kit/text.js";

/** Where a primary reward rule manifest is in its life cycle. */
export type PrimaryRewardRuleManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary reward rule manifest, with what the planners need to act on it. */
export class PrimaryRewardRuleManifest {
  code: string;
  name: string;
  pinned: boolean;
  currency: string;
  externalRef: string;
  quantity: number;
  status: PrimaryRewardRuleManifestStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    currency: string,
    externalRef: string,
    quantity: number,
    status: PrimaryRewardRuleManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.currency = currency;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryRewardRuleManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryRewardRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reward rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): PrimaryRewardRuleManifest {
    return new PrimaryRewardRuleManifest(
      this.code,
      this.name,
      this.pinned,
      this.currency,
      this.externalRef,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary reward rule manifest in status draft. */
export function newPrimaryRewardRuleManifest(code: string, name: string): PrimaryRewardRuleManifest {
  return new PrimaryRewardRuleManifest(code, name, false, "", "", 0, "draft");
}
