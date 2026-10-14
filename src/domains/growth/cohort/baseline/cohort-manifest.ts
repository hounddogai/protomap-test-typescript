import * as text from "../../../../kit/text.js";

/** Where a cohort manifest is in its life cycle. */
export type CohortManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort manifest as the cohort team keeps it. */
export class CohortManifest {
  code: string;
  label: string;
  createdAt: number;
  cost: number;
  region: string;
  status: CohortManifestStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    cost: number,
    region: string,
    status: CohortManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.cost = cost;
    this.region = region;
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

  canMoveTo(next: CohortManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CohortManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"cohort manifest"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.cost - this.createdAt) * 100) / 100;
  }

  copy(): CohortManifest {
    return new CohortManifest(this.code, this.label, this.createdAt, this.cost, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a cohort manifest in status draft. */
export function newCohortManifest(code: string, label: string): CohortManifest {
  return new CohortManifest(code, label, 0, 0, "", "draft");
}
