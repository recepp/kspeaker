import { StyleSheet, Platform } from 'react-native';

export const dropupStyles = StyleSheet.create({
  dropupRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dropupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dropupMenuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  glassShell: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingTop: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 14,
  },
  glassSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  bevelLight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bevelDark: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  glassRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropupCloseButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
    padding: 6,
  },
  dropupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  dropupItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  dropupItemText: {
    flex: 1,
    fontSize: 16,
    color: '#ECECEC',
    fontWeight: '500',
  },
  dropupItemTextLight: {
    color: '#1A1A1F',
  },
  dropupItemTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  dropupItemBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
});
