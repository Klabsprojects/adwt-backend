// module.exports = {
// mongoPath: 'mongodb://127.0.0.1:27017/shg?directConnection=true',
// }
// dbConfig: {
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'shg'
// }

module.exports = {
  // mongoPath: 'mongodb://127.0.0.1:27017/shg?directConnection=true', 
  // dbConfig: {
  //   host: '74.208.92.52',
  //   user: 'ims1',
  //   password: 'Pass@2023',
  //   database: 'womensdev',
  //   port: 3306, 
  // },
  dbConfig: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'adw_database'
  },
  keycloakConfig: {
    keycloakUrl: 'http://74.208.113.233:8081/',
    keycloakRealm: 'klabs',
    keycloakClientId: 'adwt-client',
    keycloakRoles: {
      SuperUser: 'Super User',
      SectionOfficer: 'Section Officer',
      HOUsers: 'HO Users',
      UsersofADWTWDepartment: 'Users of ADW&TW Department',
      UsersofSJHRwing: 'Users of SJ&HR wing'
    }
  }
};

