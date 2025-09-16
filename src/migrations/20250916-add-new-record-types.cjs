const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('metadata', 'recordType', {
      type: DataTypes.ENUM(
        'enrollment',
        'withdrawal',
        'applicationForm',
        'prospectForm',
        'studentForm'
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('metadata', 'recordType', {
      type: DataTypes.ENUM('enrollment', 'withdrawal'),
      allowNull: false,
    });
  },
};
