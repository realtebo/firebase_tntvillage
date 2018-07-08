pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functions') {
          sh 'npm install'
          sh 'node run lint'
          sh 'node run build'
        }

      }
    }
  }
}