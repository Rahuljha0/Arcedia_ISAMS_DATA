import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";
import FormData from "form-data";
import dayjs from "dayjs";

export const zohoAnalyticService = {
  /**
   * Common Functions
   */
  getAccessToken: async () => {
    try {
      const res = await http.post(config.zohoAnalyticApi.accessTokenUrl, null, {
        params: {
          client_id: config.zohoAnalyticApi.clientId,
          client_secret: config.zohoAnalyticApi.clientSecret,
          refresh_token: config.zohoAnalyticApi.refreshToken,
          grant_type: "refresh_token",
        },
      });
      return res.data.access_token;
    } catch (err) {
      logger.error(
        "ZohoAnalyticService: Error getting access token:",
        err.response?.data || err.message,
      );
      throw err;
    }
  },

  bulkDeleteRequest: async (viewId, token, criteria) => {
    const headers = {
      "ZANALYTICS-ORGID": config.zohoAnalyticApi.orgId,
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    const configJson = {
      criteria,
    };

    const fullUrl = `https://analyticsapi.zoho.com/restapi/v2/workspaces/${config.zohoAnalyticApi.workspaceId}/views/${viewId}/rows?CONFIG=${encodeURIComponent(JSON.stringify(configJson))}`;

    return await http.delete(fullUrl, { headers });
  },

  bulkUpsertRequest: async (viewId, data, matchingColumns = []) => {
    const token = await zohoAnalyticService.getAccessToken();
    if (!token) throw new Error("Failed to get access token");

    const formdata = new FormData();
    formdata.append("DATA", JSON.stringify(data));

    const headers = {
      ...formdata.getHeaders(),
      "ZANALYTICS-ORGID": config.zohoAnalyticApi.orgId,
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    const configJson = {
      matchingColumns,
      importType: "updateadd",
      fileType: "json",
      autoIdentify: true,
    };

    const fullUrl = `https://analyticsapi.zoho.com/restapi/v2/workspaces/${config.zohoAnalyticApi.workspaceId}/views/${viewId}/data?CONFIG=${encodeURIComponent(JSON.stringify(configJson))}`;

    return await http.post(fullUrl, formdata, { headers });
  },

  bulkExportRequest: async (viewId) => {
    const token = await zohoAnalyticService.getAccessToken();
    if (!token) throw new Error("Failed to get access token");

    const headers = {
      "ZANALYTICS-ORGID": config.zohoAnalyticApi.orgId,
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    const configJson = {
      responseFormat: "json",
    };

    const fullUrl = `https://analyticsapi.zoho.com/restapi/v2/workspaces/${config.zohoAnalyticApi.workspaceId}/views/${viewId}/data?CONFIG=${encodeURIComponent(JSON.stringify(configJson))}`;

    const response = await http.get(fullUrl, { headers });
    return response.data;
  },

  /**
   * Upsert RECORDS into Zoho Analytics
   */
  upsertEnrollments: async (students) => {
    try {
      // Extract custom fields from each withdrawal
      const flatStudents = [...students].map((student) => {
        student.languages = student.languages?.join(",") || null;
        student.nationalities = student.nationalities?.join(",") || null;

        return student;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.enrollmentViewId,
        flatStudents,
        [config.zohoAnalyticApi.primaryKeys.enrollment],
      );
      logger.info("Zoho Bulk Enrollment Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Enrollment Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertWithdrawals: async (withdrawals) => {
    try {
      // Extract custom fields from each withdrawal
      const flatWithdrawals = [...withdrawals].map((withdrawal) => {
        const customFields = withdrawal?.customFields || [];
        delete withdrawal.customFields;

        customFields.map((field) => {
          withdrawal[field.name.trim()] = field.value;
        });

        withdrawal.languages = withdrawal.languages?.join(",") || null;
        withdrawal.nationalities = withdrawal.nationalities?.join(",") || null;

        return withdrawal;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.withdrawalViewId,
        flatWithdrawals,
        [config.zohoAnalyticApi.primaryKeys.withdrawal],
      );
      logger.info("Zoho Bulk Withdrawal Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Withdrawal Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertApplicants: async (applicants) => {
    try {
      // Extract custom fields from each withdrawal
      const flatApplicants = [...applicants].map((applicant) => {
        applicant.languages = applicant.languages?.join(",") || null;
        applicant.nationalities = applicant.nationalities?.join(",") || null;

        return applicant;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.applicantViewId,
        flatApplicants,
        [config.zohoAnalyticApi.primaryKeys.applicant],
      );
      logger.info("Zoho Bulk Applicant Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Applicant Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertApplicationForms: async (applicationForms) => {
    try {
      // Extract custom fields from each application form
      const flatApplicationForms = [...applicationForms].map(
        (applicationForm) => {
          applicationForm.ID = applicationForm?.id || null;
          applicationForm.Parent = applicationForm?.Parent?.name || null;
          applicationForm.Language =
            applicationForm?.Language?.join(",") || null;
          return applicationForm;
        },
      );

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.applicationFormViewId,
        flatApplicationForms,
        [config.zohoAnalyticApi.primaryKeys.applicationForm],
      );
      logger.info("Zoho Bulk Application Forms Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Application Forms Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertProspects: async (prospects) => {
    try {
      // Extract custom fields from each application form
      const flatProspects = [...prospects].map((prospect) => {
        prospect.ID = prospect?.id || null;
        prospect.Acadmic_Year = prospect?.Acadmic_Year?.name || null;
        prospect.Contact_Name = prospect?.Contact_Name?.name || null;
        prospect.Languages = prospect?.Languages?.join(",") || null;
        prospect.Tour_Assigned_Staff =
          prospect?.Tour_Assigned_Staff?.name || null;
        prospect.Payment_Confirmation_By =
          prospect?.Payment_Confirmation_By?.name || null;
        return prospect;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.prospectFormViewId,
        flatProspects,
        [config.zohoAnalyticApi.primaryKeys.prospectForm],
      );
      logger.info("Zoho Bulk Prospects Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Prospects Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertStudentForms: async (studentForms) => {
    try {
      // Extract custom fields from each student form
      const flatStudentForms = [...studentForms].map((studentForm) => {
        studentForm.ID = studentForm?.id || null;
        studentForm.Joined_in_Academic_Year =
          studentForm?.Joined_in_Academic_Year?.name || null;
        studentForm.Primary_Contact_Name =
          studentForm?.Primary_Contact_Name?.name || null;
        studentForm.Prospect = studentForm?.Prospect?.name || null;
        studentForm.Current_Academic_Year =
          studentForm?.Current_Academic_Year?.name || null;
        studentForm.Exit_Comments =
          studentForm?.Exit_Comments?.join(",") || null;
        studentForm.Withdrawal_Reasons =
          studentForm?.Withdrawal_Reasons?.join(",") || null;
        studentForm.Language = studentForm?.Language?.join(",") || null;
        return studentForm;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.studentFormViewId,
        flatStudentForms,
        [config.zohoAnalyticApi.primaryKeys.studentForm],
      );
      logger.info("Zoho Bulk Student Forms Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Student Forms Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  upsertTours: async (tours) => {
    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      return dayjs(dateString, "DD-MMM-YYYY HH:mm:ss", true).format(
        "YYYY-MM-DD HH:mm:ss",
      );
    };

    try {
      // Extract custom fields from each student form
      const flatTours = tours.map((tour) => ({
        staff_name: tour?.staff_name || null,
        notes: tour?.notes || null,
        customer_booking_start_time: tour?.customer_booking_start_time || null,
        post_buffer: tour?.post_buffer || null,
        staff_contact_number: tour?.staff_contact_number || null,
        customer_contact_no: tour?.customer_contact_no || null,
        booked_on: tour?.booked_on || null,
        triggered_by: tour?.triggered_by || null,
        staff_designation: tour?.staff_designation || null,
        booking_id: tour?.booking_id || null,
        workspace_id: tour?.workspace_id || null,
        duration: tour?.duration || null,
        staff_id: tour?.staff_id || null,
        service_id: tour?.service_id || null,
        cost_paid: tour?.cost_paid || null,
        currency: tour?.currency || null,
        iso_end_time: tour?.iso_end_time || null,
        workspace_name: tour?.workspace_name || null,
        customer_notification: tour?.customer_notification || null,
        pre_buffer: tour?.pre_buffer || null,
        service_description: tour?.service_description || null,
        triggered_from: tour?.triggered_from || null,
        cost: tour?.cost || null,
        service_name: tour?.service_name || null,
        payment_status: tour?.payment_status || null,
        end_time: formatDateTime(tour?.end_time),
        time_zone: tour?.time_zone || null,
        iso_start_time: tour?.iso_start_time || null,
        start_time: formatDateTime(tour?.start_time),
        last_updated_time: tour?.last_updated_time || null,
        due: tour?.due || null,
        customer_email: tour?.customer_email || null,
        booking_type: tour?.booking_type || null,
        booked_ip_address: tour?.booked_ip_address || null,
        customer_name: tour?.customer_name || null,
        summary_url: tour?.summary_url || null,
        staff_email: tour?.staff_email || null,
        customer_booking_time_zone: tour?.customer_booking_time_zone || null,
        status: tour?.status || null,

        child_name: tour?.customer_more_info?.["Child Name"] || null,
        term_applying_for:
          tour?.customer_more_info?.["Term Applying For?"] || null,
        year_group: tour?.customer_more_info?.["Year Group"] || null,
        number_of_attendees:
          tour?.customer_more_info?.["No of Attendees?"] || null,
        current_school_name:
          tour?.customer_more_info?.[
            "Please name your child current school?"
          ] || null,
        subject_interests:
          tour?.customer_more_info?.[
            "Please list any subject interests which your child has?"
          ] || null,
        number_of_siblings:
          tour?.customer_more_info?.["Number of Sibling?"] || null,
        sibling_year_groups: Array.isArray(
          tour?.customer_more_info?.[
            "Does this child have siblings if so what year groups?"
          ],
        )
          ? tour.customer_more_info[
              "Does this child have siblings if so what year groups?"
            ].join(",")
          : tour?.customer_more_info?.[
              "Does this child have siblings if so what year groups?"
            ] || null,
      }));

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.tourViewId,
        flatTours,
        [config.zohoAnalyticApi.primaryKeys.tour],
      );
      logger.info("Zoho Bulk Tours Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Tours Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertAssessments: async (assessments) => {
    const formatDateTime = (dateString) => {
      if (!dateString) return null;
      return dayjs(dateString, "DD-MMM-YYYY HH:mm:ss", true).format(
        "YYYY-MM-DD HH:mm:ss",
      );
    };

    try {
      // Extract custom fields from each student form
      const flatAssessments = assessments.map((assessment) => ({
        staff_name: assessment?.staff_name || null,
        notes: assessment?.notes || null,
        customer_booking_start_time:
          assessment?.customer_booking_start_time || null,
        post_buffer: assessment?.post_buffer || null,
        staff_contact_number: assessment?.staff_contact_number || null,
        customer_contact_no: assessment?.customer_contact_no || null,
        booked_on: assessment?.booked_on || null,
        triggered_by: assessment?.triggered_by || null,
        staff_designation: assessment?.staff_designation || null,
        booking_id: assessment?.booking_id || null,
        workspace_id: assessment?.workspace_id || null,
        duration: assessment?.duration || null,
        staff_id: assessment?.staff_id || null,
        service_id: assessment?.service_id || null,
        cost_paid: assessment?.cost_paid || null,
        currency: assessment?.currency || null,
        iso_end_time: assessment?.iso_end_time || null,
        workspace_name: assessment?.workspace_name || null,
        customer_notification: assessment?.customer_notification || null,
        pre_buffer: assessment?.pre_buffer || null,
        service_description: assessment?.service_description || null,
        triggered_from: assessment?.triggered_from || null,
        cost: assessment?.cost || null,
        service_name: assessment?.service_name || null,
        payment_status: assessment?.payment_status || null,
        end_time: formatDateTime(assessment?.end_time),
        guest_emails: assessment?.guest_emails?.join(",") || null,
        time_zone: assessment?.time_zone || null,
        iso_start_time: assessment?.iso_start_time || null,
        start_time: formatDateTime(assessment?.start_time),
        last_updated_time: assessment?.last_updated_time || null,
        due: assessment?.due || null,
        customer_email: assessment?.customer_email || null,
        booking_type: assessment?.booking_type || null,
        booked_ip_address: assessment?.booked_ip_address || null,
        customer_name: assessment?.customer_name || null,
        summary_url: assessment?.summary_url || null,
        staff_email: assessment?.staff_email || null,
        customer_booking_time_zone:
          assessment?.customer_booking_time_zone || null,
        status: assessment?.status || null,

        child_name: assessment?.customer_more_info?.["Child Name"] || null,
        term_applying_for:
          assessment?.customer_more_info?.["Term Applying For?"] || null,
        year_group: assessment?.customer_more_info?.["Year Group"] || null,
        number_of_attendees:
          assessment?.customer_more_info?.["No of Attendees?"] || null,
        current_school_name:
          assessment?.customer_more_info?.[
            "Please name your child current school?"
          ] || null,
        subject_interests:
          assessment?.customer_more_info?.[
            "Please list any subject interests which your child has?"
          ] || null,
        number_of_siblings:
          assessment?.customer_more_info?.["Number of Sibling?"] || null,
        sibling_year_groups: Array.isArray(
          assessment?.customer_more_info?.[
            "Does this child have siblings if so what year groups?"
          ],
        )
          ? assessment.customer_more_info[
              "Does this child have siblings if so what year groups?"
            ].join(",")
          : assessment?.customer_more_info?.[
              "Does this child have siblings if so what year groups?"
            ] || null,
      }));

      const response = await zohoAnalyticService.bulkUpsertRequest(
        config.zohoAnalyticApi.assessmentViewId,
        flatAssessments,
        [config.zohoAnalyticApi.primaryKeys.assessment],
      );
      logger.info("Zoho Bulk Assessments Success", response.data);
      return response.data;
    } catch (err) {
      logger.error(
        "Zoho Bulk Assessments Error",
        err.response?.data || err.message,
      );
      return null;
    }
  },

  /**
   * Export records from Zoho Analytics
   */
  exportEnrollments: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.enrollmentViewId,
    );
  },
  exportWithdrawals: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.withdrawalViewId,
    );
  },
  exportApplicants: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.applicantViewId,
    );
  },
  exportApplicationForms: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.applicationFormViewId,
    );
  },
  exportProspects: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.prospectFormViewId,
    );
  },
  exportStudentForms: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.studentFormViewId,
    );
  },
  exportTours: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.tourViewId,
    );
  },
  exportAssessments: async () => {
    return await zohoAnalyticService.bulkExportRequest(
      config.zohoAnalyticApi.assessmentViewId,
    );
  },
  /**
   * Delete records from Zoho Analytics
   */
  deleteInChunks: async (Ids, primaryKey, viewId) => {
    if (!Ids?.length) return 0;

    try {
      const token = await zohoAnalyticService.getAccessToken();
      if (!token) throw new Error("Failed to get access token");

      for (let i = 0; i < Ids.length; i += 200) {
        const chunk = Ids.slice(i, i + 200);
        const criteria = `("${primaryKey}" IN (${chunk.map((id) => `'${id}'`).join(",")}))`;
        await zohoAnalyticService.bulkDeleteRequest(viewId, token, criteria);
      }
      return Ids.length;
    } catch (err) {
      logger.error(
        "Zoho Bulk Delete Error in View " + viewId,
        err.response?.data || err.message,
      );
      return 0;
    }
  },
  deleteEnrollments: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.enrollment,
      config.zohoAnalyticApi.enrollmentViewId,
    );
  },
  deleteWithdrawals: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.withdrawal,
      config.zohoAnalyticApi.withdrawalViewId,
    );
  },
  deleteApplicants: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.applicant,
      config.zohoAnalyticApi.applicantViewId,
    );
  },
  deleteApplicationForms: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.applicationForm,
      config.zohoAnalyticApi.applicationFormViewId,
    );
  },
  deleteProspects: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.prospectForm,
      config.zohoAnalyticApi.prospectFormViewId,
    );
  },
  deleteStudentForms: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.studentForm,
      config.zohoAnalyticApi.studentFormViewId,
    );
  },
  deleteTours: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.tour,
      config.zohoAnalyticApi.tourViewId,
    );
  },
  deleteAssessments: async (Ids) => {
    return await zohoAnalyticService.deleteInChunks(
      Ids,
      config.zohoAnalyticApi.primaryKeys.assessment,
      config.zohoAnalyticApi.assessmentViewId,
    );
  },
};
