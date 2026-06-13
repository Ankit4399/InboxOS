const {createCorsair} = require('corsair');
const {gmail} = require('@corsair-dev/gmail');
const {googlecalendar} = require('@corsair-dev/googlecalendar');
const {getSchema} = require('corsair');
const c = createCorsair({plugins:[gmail(),googlecalendar()], database: undefined, kek:'test', multiTenancy:true});
console.log(getSchema(c, 'googlecalendar.api.events.getMany'));
