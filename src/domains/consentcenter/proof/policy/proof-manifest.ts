import * as text from "../../../../kit/text.js";

/** Where a proof manifest is in its life cycle. */
export type ProofManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One proof manifest, with what the planners need to act on it. */
export class ProofManifest {
  code: string;
  title: string;
  windowDays: number;
  budget: number;
  updatedAt: number;
  version: number;
  archived: boolean;
  status: ProofManifestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    budget: number,
    updatedAt: number,
    version: number,
    archived: boolean,
    status: ProofManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.version = version;
    this.archived = archived;
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

  canMoveTo(next: ProofManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round((this.version + this.windowDays) * 100) / 100;
  }

  copy(): ProofManifest {
    return new ProofManifest(
      this.code,
      this.title,
      this.windowDays,
      this.budget,
      this.updatedAt,
      this.version,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof manifest in status draft. */
export function newProofManifest(code: string, title: string): ProofManifest {
  return new ProofManifest(code, title, 0, 0, 0, 0, false, "draft");
}
