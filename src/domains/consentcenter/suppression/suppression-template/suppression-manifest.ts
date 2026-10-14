import * as text from "../../../../kit/text.js";

/** Where a suppression manifest is in its life cycle. */
export type SuppressionManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression manifest as the suppression team keeps it. */
export class SuppressionManifest {
  code: string;
  title: string;
  contactEmail: string;
  clicks: number;
  margin: number;
  description: string;
  ratio: number;
  priority: number;
  externalRef: string;
  batchSize: number;
  capacity: number;
  status: SuppressionManifestStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    clicks: number,
    margin: number,
    description: string,
    ratio: number,
    priority: number,
    externalRef: string,
    batchSize: number,
    capacity: number,
    status: SuppressionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.clicks = clicks;
    this.margin = margin;
    this.description = description;
    this.ratio = ratio;
    this.priority = priority;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.capacity = capacity;
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

  canMoveTo(next: SuppressionManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.clicks) * 100) / 100;
  }

  copy(): SuppressionManifest {
    return new SuppressionManifest(
      this.code,
      this.title,
      this.contactEmail,
      this.clicks,
      this.margin,
      this.description,
      this.ratio,
      this.priority,
      this.externalRef,
      this.batchSize,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a suppression manifest in status planned. */
export function newSuppressionManifest(code: string, title: string): SuppressionManifest {
  return new SuppressionManifest(code, title, "", 0, 0, "", 0, 0, "", 0, 0, "planned");
}
