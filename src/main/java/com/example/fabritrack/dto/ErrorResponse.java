package com.example.fabritrack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Used when login is rejected due to account status (pending, inactive, suspended).
 * Includes the actual account status so the client can show a specific message.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String error, String code, String status) {

    /**
     * Build a 403 response with the actual account status.
     * @param accountStatus User status enum name: PENDING_APPROVAL, INACTIVE, SUSPENDED
     */
    public static ErrorResponse forStatus(String accountStatus) {
        if (accountStatus == null || accountStatus.isBlank()) {
            return new ErrorResponse(
                    "Your account cannot be used to sign in. Please contact an administrator.",
                    "ACCOUNT_ACCESS_DENIED",
                    null
            );
        }
        String statusUpper = accountStatus.trim().toUpperCase();
        String message;
        String code;
        switch (statusUpper) {
            case "PENDING_APPROVAL":
                message = "Your account is pending approval by an administrator. You will be able to sign in after approval.";
                code = "PENDING_APPROVAL";
                break;
            case "SUSPENDED":
                message = "Your account has been suspended. Please contact an administrator.";
                code = "SUSPENDED";
                break;
            case "INACTIVE":
                message = "Your account is inactive. Please contact an administrator.";
                code = "INACTIVE";
                break;
            default:
                message = "Your account cannot be used to sign in. Please contact an administrator.";
                code = "ACCOUNT_ACCESS_DENIED";
                break;
        }
        return new ErrorResponse(message, code, statusUpper);
    }

    /** @deprecated Use {@link #forStatus(String)} */
    public static ErrorResponse pendingApproval() {
        return forStatus("PENDING_APPROVAL");
    }

    /** @deprecated Use {@link #forStatus(String)} */
    public static ErrorResponse rejected() {
        return forStatus("INACTIVE");
    }
}
