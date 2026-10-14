import * as text from "../../../../kit/text.js";

/** Where a reply manifest is in its life cycle. */
export type ReplyManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** One reply manifest, with what the planners need to act on it. */
export class ReplyManifest {
  code: string;
  name: string;
  discount: number;
  threshold: number;
  source: string;
  updatedAt: number;
  clicks: number;
  campaignRef: string;
  ratio: number;
  status: ReplyManifestStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    threshold: number,
    source: string,
    updatedAt: number,
    clicks: number,
    campaignRef: string,
    ratio: number,
    status: ReplyManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.threshold = threshold;
    this.source = source;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ReplyManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reply manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.threshold + this.updatedAt) * 100) / 100;
  }

  copy(): ReplyManifest {
    return new ReplyManifest(
      this.code,
      this.name,
      this.discount,
      this.threshold,
      this.source,
      this.updatedAt,
      this.clicks,
      this.campaignRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply manifest in status requested. */
export function newReplyManifest(code: string, name: string): ReplyManifest {
  return new ReplyManifest(code, name, 0, 0, "", 0, 0, "", 0, "requested");
}
