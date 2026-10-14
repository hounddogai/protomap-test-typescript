import * as text from "../../../../kit/text.js";

/** Where a invite manifest is in its life cycle. */
export type InviteManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A invite manifest. Its code is unique within a tenant. */
export class InviteManifest {
  code: string;
  name: string;
  ratio: number;
  title: string;
  frequencyCap: number;
  status: InviteManifestStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    title: string,
    frequencyCap: number,
    status: InviteManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.title = title;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: InviteManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
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

  moveTo(next: InviteManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"invite manifest"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.ratio - this.frequencyCap) * 100) / 100;
  }

  copy(): InviteManifest {
    return new InviteManifest(this.code, this.name, this.ratio, this.title, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite manifest in status draft. */
export function newInviteManifest(code: string, name: string): InviteManifest {
  return new InviteManifest(code, name, 0, "", 0, "draft");
}
