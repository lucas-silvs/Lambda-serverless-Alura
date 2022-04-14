"use strict";

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

const pacientes = [
  { id: 1, nome: "Robin", dataNascimento: "1984-01-11" },
  { id: 2, nome: "Batman", dataNascimento: "1986-02-05" },
  { id: 3, nome: "Superman", dataNascimento: "1990-04-20" },
  { id: 4, nome: "Doutor estranho", dataNascimento: "2000-11-03" },
];

const AWS = require("aws-sdk");
const {v4:uuidv4} = require("uuid")
const moment = require("moment");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: "PACIENTES",
};

function buscarnaListaPaciente(id) {
  return pacientes.find((paciente) => paciente.id == id);
}

module.exports.listarPacientes = async (event) => {
  try {
    let dados = await dynamoDb.scan(params).promise();
    console.log(event);
    return {
      statusCode: 200,
      body: JSON.stringify(dados.Items),
    };
  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.buscarPaciente = async (event) => {
  try {
    const { pacienteId } = event.pathParameters;
    //Essa linha funciona semelhante a uma consulta por Id em SQL: select * from PACIENTES where paciemte_id = pacienteId
    const results = await dynamoDb
      .get({
        ...params,
        Key: {
          paciente_id: pacienteId,
        },
      })
      .promise();
    if (!results.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify(
          {
            error:
              "Paciente com id " + pacienteId + " não existe na base de dados",
          },
          null,
          2
        ),
      };
    }
    const paciente = results.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(paciente),
    };
  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.cadastrarPaciente = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const dataCriacao = new Date().getTime();

    const {  nome, data_nascimento, email, telefone } = payload;

    const paciente = {
      paciente_id: uuidv4(),
      nome,
      data_nascimento,
      email,
      telefone,
      status: true,
      criado_em: dataCriacao,
      atualizado_em: dataCriacao,
    };

    await dynamoDb
      .put({
        TableName: "PACIENTES",
        Item: paciente,
      })
      .promise();

    return {
      statusCode: 201,
    };
  } catch (err) {
    console.log(event);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};
