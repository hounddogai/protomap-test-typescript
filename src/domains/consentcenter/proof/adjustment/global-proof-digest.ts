import * as text from "../../../../kit/text.js";

/** Where a global proof digest is in its life cycle. */
export type GlobalProofDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A global proof digest. Its code is unique within a tenant. */
export class GlobalProofDigest {
  code: string;
  title: string;
  checksum: string;
  locale: string;
  updatedAt: number;
  version: number;
  minimum: number;
  campaignRef: string;
  endsAt: number;
  ratio: number;
  status: GlobalProofDigestStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    locale: string,
    updatedAt: number,
    version: number,
    minimum: number,
    campaignRef: string,
    endsAt: number,
    ratio: number,
    status: GlobalProofDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.version = version;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.ratio = ratio;
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

  canMoveTo(next: GlobalProofDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalProofDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global proof digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.version - this.minimum) * 100) / 100;
  }

  copy(): GlobalProofDigest {
    return new GlobalProofDigest(
      this.code,
      this.title,
      this.checksum,
      this.locale,
      this.updatedAt,
      this.version,
      this.minimum,
      this.campaignRef,
      this.endsAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global proof digest in status requested. */
export function newGlobalProofDigest(code: string, title: string): GlobalProofDigest {
  return new GlobalProofDigest(code, title, "", "", 0, 0, 0, "", 0, 0, "requested");
}
