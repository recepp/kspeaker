import { StyleSheet, Dimensions } from 'react-native';

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#2F2F2F',
    borderRadius: 16,
    width: '100%',
    maxWidth: Dimensions.get('window').width >= 768 ? 600 : 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    padding: 24,
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalHeaderLight: {
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ECECEC',
  },
  modalTitleLight: {
    color: '#1A1A1F',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7DD3C0',
    marginBottom: 16,
    textAlign: 'center',
  },
  aboutSection: {
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  aboutText: {
    flex: 1,
    fontSize: 15,
    color: '#ECECEC',
    lineHeight: 22,
  },
  aboutTextLight: {
    color: '#1A1A1F',
  },
  aboutFooter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7DD3C0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 16,
  },
  languageOptionLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(125, 211, 192, 0.15)',
    borderWidth: 1,
    borderColor: '#7DD3C0',
  },
  languageFlag: {
    fontSize: 32,
  },
  languageText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECEC',
  },
  languageTextLight: {
    color: '#1A1A1F',
  },
  approvalIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  approvalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  approvalTitleLight: {
    color: '#1A1A1F',
  },
  approvalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  approvalMessageLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  approvalButton: {
    backgroundColor: '#7DD3C0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  approvalButtonLight: {
    backgroundColor: '#4A6FA5',
  },
  approvalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#ECECEC',
    marginLeft: 12,
  },
  settingsItemTextLight: {
    color: '#1A1A1F',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  // FAQ Styles
  faqItem: {
    marginBottom: 24,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
    flex: 1,
  },
  faqQuestionTextLight: {
    color: '#1A1A1F',
  },
  faqAnswer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginLeft: 32,
  },
  faqAnswerLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  // Support Styles
  supportSection: {
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECEC',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportTitleLight: {
    color: '#1A1A1F',
  },
  supportText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
  supportTextLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#7DD3C0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
  },
  supportButtonLight: {
    backgroundColor: '#4A6FA5',
  },
  supportButtonDisabled: {
    backgroundColor: 'rgba(125, 211, 192, 0.5)',
    opacity: 0.6,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supportInputContainer: {
    marginBottom: 16,
  },
  supportInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECECEC',
    marginBottom: 8,
  },
  supportInputLabelLight: {
    color: '#1A1A1F',
  },
  supportInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ECECEC',
  },
  supportInputLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#1A1A1F',
  },
  supportTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ECECEC',
    minHeight: 120,
  },
  supportInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: 4,
  },
  supportDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  socialButton: {
    padding: 8,
  },
  // Voucher Styles
  voucherSection: {
    marginBottom: 20,
  },
  voucherTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ECECEC',
    marginBottom: 12,
    textAlign: 'center',
  },
  voucherTitleLight: {
    color: '#1A1A1F',
  },
  voucherText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
  voucherTextLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  voucherInputContainer: {
    marginVertical: 16,
  },
  voucherInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ECECEC',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
  },
  voucherInputLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    color: '#1A1A1F',
  },
  voucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#7DD3C0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  voucherButtonLight: {
    backgroundColor: '#4A6FA5',
  },
  voucherButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voucherDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 24,
  },
  voucherInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
    marginBottom: 12,
  },
  voucherInfoTitleLight: {
    color: '#1A1A1F',
  },
  voucherFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  voucherFeatureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  voucherFeatureTextLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
});
