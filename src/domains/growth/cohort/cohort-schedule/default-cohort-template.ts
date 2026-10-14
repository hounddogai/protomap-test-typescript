import * as text from "../../../../kit/text.js";

/** Where a default cohort template is in its life cycle. */
export type DefaultCohortTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default cohort template as the cohort team keeps it. */
export class DefaultCohortTemplate {
  code: string;
  name: string;
  unit: string;
  updatedAt: number;
  externalRef: string;
  ratio: number;
  contactEmail: string;
  attempts: number;
  openRate: number;
  audienceId: string;
  status: DefaultCohortTemplateStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    updatedAt: number,
    externalRef: string,
    ratio: number,
    contactEmail: string,
    attempts: number,
    openRate: number,
    audienceId: string,
    status: DefaultCohortTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultCohortTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultCohortTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default cohort template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default cohort template"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.ratio - this.openRate) * 100) / 100;
  }

  copy(): DefaultCohortTemplate {
    return new DefaultCohortTemplate(
      this.code,
      this.name,
      this.unit,
      this.updatedAt,
      this.externalRef,
      this.ratio,
      this.contactEmail,
      this.attempts,
      this.openRate,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default cohort template in status new. */
export function newDefaultCohortTemplate(code: string, name: string): DefaultCohortTemplate {
  return new DefaultCohortTemplate(code, name, "", 0, "", 0, "", 0, 0, "", "new");
}
