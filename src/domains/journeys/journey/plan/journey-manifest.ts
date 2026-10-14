import * as text from "../../../../kit/text.js";

/** Where a journey manifest is in its life cycle. */
export type JourneyManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** A journey manifest. Its code is unique within a tenant. */
export class JourneyManifest {
  code: string;
  name: string;
  externalRef: string;
  checksum: string;
  frequencyCap: number;
  createdAt: number;
  status: JourneyManifestStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    checksum: string,
    frequencyCap: number,
    createdAt: number,
    status: JourneyManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
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

  canMoveTo(next: JourneyManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"journey manifest"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.createdAt + this.frequencyCap) * 100) / 100;
  }

  copy(): JourneyManifest {
    return new JourneyManifest(
      this.code,
      this.name,
      this.externalRef,
      this.checksum,
      this.frequencyCap,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey manifest in status requested. */
export function newJourneyManifest(code: string, name: string): JourneyManifest {
  return new JourneyManifest(code, name, "", "", 0, 0, "requested");
}
