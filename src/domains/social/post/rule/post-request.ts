import * as text from "../../../../kit/text.js";

/** Where a post request is in its life cycle. */
export type PostRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A post request. Its code is unique within a tenant. */
export class PostRequest {
  code: string;
  title: string;
  maximum: number;
  country: string;
  notes: string;
  visible: boolean;
  status: PostRequestStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    country: string,
    notes: string,
    visible: boolean,
    status: PostRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.country = country;
    this.notes = notes;
    this.visible = visible;
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

  canMoveTo(next: PostRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PostRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"post request"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): PostRequest {
    return new PostRequest(this.code, this.title, this.maximum, this.country, this.notes, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a post request in status proposed. */
export function newPostRequest(code: string, title: string): PostRequest {
  return new PostRequest(code, title, 0, "", "", false, "proposed");
}
