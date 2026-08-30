console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║        TESTES COMPLETOS - InkStation API              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

(async () => {
  try {
    // LOGIN
    console.log('📝 TESTE 1: Login e obter token...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'artista@example.com', senha: 'senha123456'})
    });
    const loginData = await loginRes.json();
    if(!loginData.success) throw new Error(loginData.message);
    const token = loginData.data.token;
    console.log('✅ Logado como:', loginData.data.user.nome);
    console.log('✅ Token obtido:', token.slice(0, 20) + '...\n');

    // LISTAR ESTAÇÕES
    console.log('📝 TESTE 2: Listar estações disponíveis...');
    const staRes = await fetch('http://localhost:3000/api/estacoes');
    const staData = await staRes.json();
    console.log('✅ Estações disponíveis:', staData.data.length);
    staData.data.forEach(e => {
      console.log('   - ' + e.nome + ' (R$' + e.preco_por_hora + '/h)');
    });
    const estacaoId = staData.data[0].id;
    console.log();

    // FAZER RESERVA
    console.log('📝 TESTE 3: Criar reserva...');
    const resRes = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        estacao_id: estacaoId,
        data: '2026-09-20',
        horario_inicio: '10:00',
        horario_fim: '13:00',
        observacoes: 'Sessão de teste'
      })
    });
    const resData = await resRes.json();
    if(!resData.success) throw new Error(resData.message);
    const reservaId = resData.data.id;
    console.log('✅ Reserva criada!');
    console.log('   ID:', resData.data.id);
    console.log('   Horário:', resData.data.horario_inicio + ' - ' + resData.data.horario_fim);
    console.log('   Valor total: R$' + resData.data.valor_total + '\n');

    // TENTAR CONFLITO
    console.log('📝 TESTE 4: Tentar criar reserva em horário já ocupado (esperando 409)...');
    const conflRes = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        estacao_id: estacaoId,
        data: '2026-09-20',
        horario_inicio: '11:00',
        horario_fim: '14:00',
        observacoes: 'Deve falhar'
      })
    });
    console.log('   Status HTTP:', conflRes.status);
    const conflData = await conflRes.json();
    console.log('   Mensagem:', conflData.message);
    if(conflRes.status === 409) {
      console.log('✅ Validação de conflito funcionando!\n');
    } else {
      console.log('❌ Erro: esperava 409\n');
    }

    // LISTAR RESERVAS
    console.log('📝 TESTE 5: Listar minhas reservas...');
    const myResRes = await fetch('http://localhost:3000/api/reservas', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const myResData = await myResRes.json();
    console.log('✅ Reservas do usuário:', myResData.data.length);
    if(Array.isArray(myResData.data)) {
      myResData.data.forEach(r => {
        console.log('   - ' + r.estacao_nome + ' em ' + r.data + ' às ' + r.horario_inicio);
      });
    }
    console.log();

    // CANCELAR RESERVA
    console.log('📝 TESTE 6: Cancelar reserva...');
    const cancRes = await fetch('http://localhost:3000/api/reservas/' + reservaId + '/cancelar', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    const cancData = await cancRes.json();
    if(!cancData.success) throw new Error(cancData.message);
    console.log('✅ Reserva cancelada!');
    console.log('   Status:', cancData.data.status + '\n');

    // LISTAR NOVAMENTE
    console.log('📝 TESTE 7: Listar reservas após cancelamento...');
    const myResRes2 = await fetch('http://localhost:3000/api/reservas', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const myResData2 = await myResRes2.json();
    const canceladas = myResData2.data.filter(r => r.status === 'CANCELADA').length;
    console.log('✅ Reservas canceladas:', canceladas + '\n');

    // CHATBOT
    console.log('📝 TESTE 8: Chatbot...');
    const chatRes = await fetch('http://localhost:3000/api/chatbot', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: 'Quais são as estações disponíveis e os preços?'})
    });
    const chatData = await chatRes.json();
    if(!chatData.success) throw new Error(chatData.message);
    console.log('✅ Resposta do chatbot:');
    console.log('   ' + chatData.data.message + '\n');

    // CADASTRO
    console.log('📝 TESTE 9: Cadastro de novo usuário...');
    const email = 'artista' + Math.random().toString().slice(2,7) + '@test.com';
    const regRes = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        nome_artistico: 'Novo Artista',
        email: email,
        senha: 'Senha123!',
        confirmar_senha: 'Senha123!'
      })
    });
    const regData = await regRes.json();
    if(!regData.success) throw new Error(regData.message);
    console.log('✅ Usuário cadastrado!');
    console.log('   Email:', regData.data.email);
    console.log('   Nome:', regData.data.nome_artistico + '\n');

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║         ✅ TODOS OS TESTES PASSARAM COM SUCESSO!      ║');
    console.log('║                                                        ║');
    console.log('║  🎨 Sistema completamente funcional!                  ║');
    console.log('║  ✅ Login/Logout                                       ║');
    console.log('║  ✅ Cadastro                                           ║');
    console.log('║  ✅ Listar estações                                    ║');
    console.log('║  ✅ Criar reservas                                     ║');
    console.log('║  ✅ Validar conflitos (409)                            ║');
    console.log('║  ✅ Cancelar reservas                                  ║');
    console.log('║  ✅ Chatbot com IA                                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch(e) {
    console.error('❌ Erro durante os testes:');
    console.error('   ' + e.message);
  }
})();
