import * as text from "../../../../kit/text.js";

/** Where a lenient model manifest is in its life cycle. */
export type LenientModelManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** One lenient model manifest, with what the planners need to act on it. */
export class LenientModelManifest {
  code: string;
  label: string;
  title: string;
  locale: string;
  threshold: number;
  cost: number;
  updatedAt: number;
  approved: boolean;
  visible: boolean;
  cohort: string;
  impressions: number;
  status: LenientModelManifestStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    locale: string,
    threshold: number,
    cost: number,
    updatedAt: number,
    approved: boolean,
    visible: boolean,
    cohort: string,
    impressions: number,
    status: LenientModelManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.locale = locale;
    this.threshold = threshold;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.approved = approved;
    this.visible = visible;
    this.cohort = cohort;
    this.impressions = impressions;
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

  canMoveTo(next: LenientModelManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientModelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient model manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"lenient model manifest"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.updatedAt - this.impressions) * 100) / 100;
  }

  copy(): LenientModelManifest {
    return new LenientModelManifest(
      this.code,
      this.label,
      this.title,
      this.locale,
      this.threshold,
      this.cost,
      this.updatedAt,
      this.approved,
      this.visible,
      this.cohort,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient model manifest in status requested. */
export function newLenientModelManifest(code: string, label: string): LenientModelManifest {
  return new LenientModelManifest(code, label, "", "", 0, 0, 0, false, false, "", 0, "requested");
}
