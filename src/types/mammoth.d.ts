declare module "mammoth" {
  interface Result {
    value: string;
    messages: { type: string; message: string }[];
  }
  function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<Result>;
}
