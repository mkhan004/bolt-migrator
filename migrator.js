#!/usr/bin/env node

'use strict';

const program = require('commander');
const CsvHelper = require('./lib/csvHelper');
const fs = require('fs');
const co = require('co');

let csvHelperInstance = new CsvHelper();

program
  .version('1.0.0')
  .arguments('request <requestFile> validation <validationFile>')
  .option('-r, --request <requestFile>', 'requestFile path')
  .option('-v, --validation <validationFile>', 'validationFile path')
  .parse(process.argv);

const requestFile = program.request;
const validationFile = program.validation;

if (!requestFile || !validationFile) {
  program.outputHelp();
  process.exit(1);
}

(co.wrap(function* start() {
  let data = yield csvHelperInstance.processRequestData(requestFile);
  // console.log(JSON.stringify(data, null, 2));

  yield csvHelperInstance.processValidationData(validationFile);
  let val = csvHelperInstance.requestGenerator();
  console.log(val);
}))();
