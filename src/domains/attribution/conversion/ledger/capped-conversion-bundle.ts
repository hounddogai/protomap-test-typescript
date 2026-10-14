import * as text from "../../../../kit/text.js";

/** Where a capped conversion bundle is in its life cycle. */
export type CappedConversionBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped conversion bundle. Its code is unique within a tenant. */
export class CappedConversionBundle {
  code: string;
  label: string;
  clicks: number;
  threshold: number;
  summary: string;
  status: CappedConversionBundleStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    threshold: number,
    summary: string,
    status: CappedConversionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.threshold = threshold;
    this.summary = summary;
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

  canMoveTo(next: CappedConversionBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedConversionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped conversion bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped conversion bundle"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.clicks * this.threshold * 100) / 100;
  }

  copy(): CappedConversionBundle {
    return new CappedConversionBundle(this.code, this.label, this.clicks, this.threshold, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped conversion bundle in status proposed. */
export function newCappedConversionBundle(code: string, label: string): CappedConversionBundle {
  return new CappedConversionBundle(code, label, 0, 0, "", "proposed");
}
