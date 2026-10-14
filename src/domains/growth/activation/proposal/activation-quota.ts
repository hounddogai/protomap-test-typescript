import * as text from "../../../../kit/text.js";

/** Where a activation quota is in its life cycle. */
export type ActivationQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A activation quota. Its code is unique within a tenant. */
export class ActivationQuota {
  code: string;
  label: string;
  locale: string;
  ownerId: string;
  title: string;
  active: boolean;
  amount: number;
  status: ActivationQuotaStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    ownerId: string,
    title: string,
    active: boolean,
    amount: number,
    status: ActivationQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.ownerId = ownerId;
    this.title = title;
    this.active = active;
    this.amount = amount;
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

  canMoveTo(next: ActivationQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ActivationQuota {
    return new ActivationQuota(
      this.code,
      this.label,
      this.locale,
      this.ownerId,
      this.title,
      this.active,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation quota in status requested. */
export function newActivationQuota(code: string, label: string): ActivationQuota {
  return new ActivationQuota(code, label, "", "", "", false, 0, "requested");
}
