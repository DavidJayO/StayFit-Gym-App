// The installed react-native-worklets package is missing the declaration file
// referenced by its package metadata. Keep the app's used API typed locally.
declare module "react-native-worklets" {
  export function scheduleOnRN<Args extends unknown[], ReturnValue>(
    fun: (...args: Args) => ReturnValue,
    ...args: Args
  ): void;
}
