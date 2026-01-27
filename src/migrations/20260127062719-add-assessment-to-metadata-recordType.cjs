const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("metadata", "recordType", {
      type: DataTypes.ENUM(
        "enrollment",
        "withdrawal",
        "applicationForm",
        "prospectForm",
        "studentForm",
        "applicant",
        "tour",
        "assessment",
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("metadata", "recordType", {
      type: DataTypes.ENUM(
        "enrollment",
        "withdrawal",
        "applicationForm",
        "prospectForm",
        "studentForm",
        "applicant",
        "tour",
      ),
      allowNull: false,
    });
  },
};
