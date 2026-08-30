export const STREAMER_APPLICATION_FLAG = "STREAMER_APPLICATION";

export function isStreamerApplication(reviewFlag?: string | null) {
  return reviewFlag === STREAMER_APPLICATION_FLAG;
}
