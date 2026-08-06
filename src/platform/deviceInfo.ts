import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getOrCreateDeviceId } from '../../deviceId';

export interface DeviceInformation {
  deviceId: string;
  platform: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
}

export { formatPlatformLabel } from './deviceInfoFormat';

/**
 * Collects display-ready device metadata for support / diagnostics.
 * Single responsibility: read identity + runtime facts only.
 */
export async function getDeviceInformation(): Promise<DeviceInformation> {
  const deviceId = await getOrCreateDeviceId();

  return {
    deviceId,
    platform: Platform.OS,
    systemVersion: String(Platform.Version),
    appVersion: DeviceInfo.getVersion(),
    buildNumber: DeviceInfo.getBuildNumber(),
  };
}
