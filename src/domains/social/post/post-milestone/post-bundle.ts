import * as text from "../../../../kit/text.js";

/** Where a post bundle is in its life cycle. */
export type PostBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A post bundle. Its code is unique within a tenant. */
export class PostBundle {
  code: string;
  name: string;
  visible: boolean;
  batchSize: number;
  label: string;
  audienceId: string;
  rate: number;
  clicks: number;
  country: string;
  createdAt: number;
  bid: number;
  status: PostBundleStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    batchSize: number,
    label: string,
    audienceId: string,
    rate: number,
    clicks: number,
    country: string,
    createdAt: number,
    bid: number,
    status: PostBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.batchSize = batchSize;
    this.label = label;
    this.audienceId = audienceId;
    this.rate = rate;
    this.clicks = clicks;
    this.country = country;
    this.createdAt = createdAt;
    this.bid = bid;
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

  canMoveTo(next: PostBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PostBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"post bundle"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.createdAt + this.rate) * 100) / 100;
  }

  copy(): PostBundle {
    return new PostBundle(
      this.code,
      this.name,
      this.visible,
      this.batchSize,
      this.label,
      this.audienceId,
      this.rate,
      this.clicks,
      this.country,
      this.createdAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a post bundle in status proposed. */
export function newPostBundle(code: string, name: string): PostBundle {
  return new PostBundle(code, name, false, 0, "", "", 0, 0, "", 0, 0, "proposed");
}
