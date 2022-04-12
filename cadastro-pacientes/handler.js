'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
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
  {id: 1 ,nome: "Robin", dataNascimento : "1984-01-11"},
  {id: 2 ,nome: "Batman", dataNascimento : "1986-02-05"},
  {id: 3 ,nome:"Superman", dataNascimento : "1990-04-20"},
  {id: 4 ,nome: "Doutor estranho", dataNascimento : "2000-11-03"}
  ];

module.exports.listarPacientes = async event => {
  console.log(event)
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        pacientes
      }
    )
  }
  

}
