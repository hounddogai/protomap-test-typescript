import * as text from "../../../../kit/text.js";

/** Where a scheduled step manifest is in its life cycle. */
export type ScheduledStepManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled step manifest as the step team keeps it. */
export class ScheduledStepManifest {
  code: string;
  label: string;
  contactEmail: string;
  checksum: string;
  quantity: number;
  visible: boolean;
  segment: string;
  status: ScheduledStepManifestStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksum: string,
    quantity: number,
    visible: boolean,
    segment: string,
    status: ScheduledStepManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.quantity = quantity;
    this.visible = visible;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledStepManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledStepManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled step manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled step manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ScheduledStepManifest {
    return new ScheduledStepManifest(
      this.code,
      this.label,
      this.contactEmail,
      this.checksum,
      this.quantity,
      this.visible,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled step manifest in status planned. */
export function newScheduledStepManifest(code: string, label: string): ScheduledStepManifest {
  return new ScheduledStepManifest(code, label, "", "", 0, false, "", "planned");
}
