'use strict';

const utils = require('./utils');
const lodash = require('lodash');
const YAML = require('json2yaml');

let request = [];
let validation = [];

class CsvHelper {

  *processRequestData(requestFile) {
    let data = yield utils.parseCSV(requestFile);
    data.forEach(function (req) {
      let sampleReq = {};
      sampleReq.id = parseInt(req.ID);
      sampleReq.method = req.method;
      let regexp = /{(.*?)}/gi;
      let pathParameters = req.endPoint.match(regexp);
      let path = req.endPoint;

      let queryParam = '';

      if (req.param1) {
        queryParam = queryParam + req.param1
      }

      if (req.param2) {
        queryParam = queryParam + '&' + req.param2
      }

      if (req.param3) {
        queryParam = queryParam + '&' + req.param3
      }

      if (req.param4) {
        queryParam = queryParam + '&' + req.param4
      }

      if (pathParameters) {
        let indexArray = [];
        let index = 1;
        pathParameters.forEach(function (pathParameter) {
          let val = req[`input${index}`];
          indexArray.push(parseInt(val.split('.')[0].replace('{', '')));
          path = path.toString().replace(pathParameter, `{${val}}`);
          index++;
        });
        sampleReq.dependsOn = indexArray;
      }

      if (queryParam) {
        sampleReq.path = path + '?' + queryParam;
      } else {
        sampleReq.path = path;
      }

      sampleReq.description = req.description;
      let dir = requestFile.substring(0, requestFile.indexOf('REST_API_Test'));

      if (req.profile) {
        let bodyFilePath = dir + 'REST_API_Test' + req.profile.replace('./', '/');
        let content = utils.loadJsonOrParse(bodyFilePath);
        if (content === null) {
          content = utils.loadTextFile(bodyFilePath);
          sampleReq.profile = content;
        } else {
          sampleReq.profile = content;
        }
      }

      if (req.headers) {
        let filePath = dir + 'REST_API_Test' + req.headers.replace('./', '/');
        let jsonBody = {};
        let content = utils.loadTextFile(filePath);
        content = content.split(';');

        for (let key in content) {
          let headArray = content[key].split(':');
          jsonBody[headArray[0]] = headArray[1];
        }

        jsonBody['Content-Type'] = 'application/json';

        sampleReq.headers = jsonBody;
      }

      if (req.inputFile) {
        let bodyFilePath = dir + 'REST_API_Test' + req.inputFile.replace('./', '/');
        let content = utils.loadJsonOrParse(bodyFilePath);
        if (content === null) {
          content = utils.loadTextFile(bodyFilePath);
          sampleReq.body = content;
        } else {
          sampleReq.body = content;
        }
      }

      request.push(sampleReq);
    })

    return request;
  }

  *processValidationData(validationFile) {
    let data = yield utils.parseCSV(validationFile);

    data.forEach(function (req) {
      let sampleReq = {};
      let jsonContains = {};
      let node;
      let value;
      sampleReq.id = parseInt(req.DataID);
      if (req.respHttpcode) {
        sampleReq.statusCode = parseInt(req.respHttpcode);
      }

      if (req.respField) {
        sampleReq[req.respField] = req.respValue;
      }

      if (req.Negativetest) {
        sampleReq.negative = true;
      }

      validation.push(sampleReq);
    });

    return validation;
  }

  requestGenerator() {
    request.forEach(function (req) {
      let newVal = {};
      let another = {};
      let negativeTest = {};
      let picked = lodash.filter(validation, {'id': req.id});
      picked.forEach(function (pick) {
        delete pick.id;
        for (let obj in pick) {
          if (obj === 'statusCode') {
            newVal[obj] = pick[obj];
          } else {
            if (pick.negative) {
              negativeTest[obj] = pick[obj];
            } else {
              another[obj] = pick[obj];
            }
          }
        }
      });

      // console.log(another)

      req.validate = newVal;
      if (!isEmpty(another)) {
          req.validate.jsonContains = another;
      }

      delete negativeTest.negative;
      if (!isEmpty(negativeTest)) {
        req.validate.jsonNotContains = negativeTest;
      }
    });

    // console.log(JSON.stringify(request[427].validate.jsonContains, null, 2))

    let yamlText = YAML.stringify(request);

    utils.writeFile('./request.yaml', yamlText);

    return yamlText;
  }
}

module.exports = CsvHelper;
