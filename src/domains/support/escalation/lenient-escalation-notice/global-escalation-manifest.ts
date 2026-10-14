import * as text from "../../../../kit/text.js";

/** Where a global escalation manifest is in its life cycle. */
export type GlobalEscalationManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a global escalation manifest and its current status. */
export class GlobalEscalationManifest {
  code: string;
  label: string;
  summary: string;
  segment: string;
  createdAt: number;
  margin: number;
  unit: string;
  maximum: number;
  status: GlobalEscalationManifestStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    segment: string,
    createdAt: number,
    margin: number,
    unit: string,
    maximum: number,
    status: GlobalEscalationManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.segment = segment;
    this.createdAt = createdAt;
    this.margin = margin;
    this.unit = unit;
    this.maximum = maximum;
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

  canMoveTo(next: GlobalEscalationManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalEscalationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.createdAt * this.maximum * 100) / 100;
  }

  copy(): GlobalEscalationManifest {
    return new GlobalEscalationManifest(
      this.code,
      this.label,
      this.summary,
      this.segment,
      this.createdAt,
      this.margin,
      this.unit,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global escalation manifest in status new. */
export function newGlobalEscalationManifest(code: string, label: string): GlobalEscalationManifest {
  return new GlobalEscalationManifest(code, label, "", "", 0, 0, "", 0, "new");
}
