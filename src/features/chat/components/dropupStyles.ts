import { StyleSheet } from 'react-native';

export const dropupStyles = StyleSheet.create({
  dropupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  dropupMenuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  dropupCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  dropupMenu: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 8,
    paddingTop: 36,
  },
  dropupMenuLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  dropupItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
