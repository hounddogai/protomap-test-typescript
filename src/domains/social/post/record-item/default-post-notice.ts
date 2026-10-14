import * as text from "../../../../kit/text.js";

/** Where a default post notice is in its life cycle. */
export type DefaultPostNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A default post notice. Its code is unique within a tenant. */
export class DefaultPostNotice {
  code: string;
  title: string;
  batchSize: number;
  updatedAt: number;
  campaignRef: string;
  country: string;
  status: DefaultPostNoticeStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    updatedAt: number,
    campaignRef: string,
    country: string,
    status: DefaultPostNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.country = country;
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

  canMoveTo(next: DefaultPostNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultPostNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.batchSize * this.updatedAt * 100) / 100;
  }

  copy(): DefaultPostNotice {
    return new DefaultPostNotice(
      this.code,
      this.title,
      this.batchSize,
      this.updatedAt,
      this.campaignRef,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a default post notice in status requested. */
export function newDefaultPostNotice(code: string, title: string): DefaultPostNotice {
  return new DefaultPostNotice(code, title, 0, 0, "", "", "requested");
}
