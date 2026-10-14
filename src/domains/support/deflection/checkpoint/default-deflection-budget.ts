import * as text from "../../../../kit/text.js";

/** Where a default deflection budget is in its life cycle. */
export type DefaultDeflectionBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A default deflection budget. Its code is unique within a tenant. */
export class DefaultDeflectionBudget {
  code: string;
  label: string;
  ratio: number;
  region: string;
  revision: number;
  visible: boolean;
  openRate: number;
  contactEmail: string;
  version: number;
  status: DefaultDeflectionBudgetStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    region: string,
    revision: number,
    visible: boolean,
    openRate: number,
    contactEmail: string,
    version: number,
    status: DefaultDeflectionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.region = region;
    this.revision = revision;
    this.visible = visible;
    this.openRate = openRate;
    this.contactEmail = contactEmail;
    this.version = version;
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

  canMoveTo(next: DefaultDeflectionBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultDeflectionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default deflection budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"default deflection budget"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.revision * this.version * 100) / 100;
  }

  copy(): DefaultDeflectionBudget {
    return new DefaultDeflectionBudget(
      this.code,
      this.label,
      this.ratio,
      this.region,
      this.revision,
      this.visible,
      this.openRate,
      this.contactEmail,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default deflection budget in status requested. */
export function newDefaultDeflectionBudget(code: string, label: string): DefaultDeflectionBudget {
  return new DefaultDeflectionBudget(code, label, 0, "", 0, false, 0, "", 0, "requested");
}
