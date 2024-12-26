// Helper function to check if bankDetails are empty
function isEmptyBankDetails(bankDetails) {
    return (
        !bankDetails.IFSC.trim() &&
        !bankDetails.bankName.trim() &&
        !bankDetails.accountNumber.trim() &&
        !bankDetails.branchName.trim() &&
        !bankDetails.accountType.trim() &&
        !bankDetails.accountStatus.trim()
    );
}
// 11-11
function isEmptyBankLinkageRows(bankLinkageRows) {
    return (
        !bankLinkageRows.loanType ||
        !bankLinkageRows.dosage ||
        !bankLinkageRows.amount ||
        !bankLinkageRows.bankName ||
        !bankLinkageRows.loanAcNumber ||
        !bankLinkageRows.roi ||
        !bankLinkageRows.tenure ||
        !bankLinkageRows.balance ||
        !bankLinkageRows.date ||
        !bankLinkageRows.closingDate ||
        !bankLinkageRows.IFSC ||
        !bankLinkageRows.branchName
    );
}

const uniqueData = (list) => {
    const data = Array.from(new Set(list.map(JSON.stringify))).map(JSON.parse);
    return data;
};
module.exports ={
    isEmptyBankDetails,
    isEmptyBankLinkageRows,
    uniqueData
}