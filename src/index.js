import './scss/index.scss'
import $ from 'jquery'

const url = window.location.origin
const socket = io.connect(url)

let myTurn = true
let symbol

const getBoardState = function() {
  const obj = {}
  $('.game__boards .game__board').each(function() {
    obj[$(this).attr('id')] = $(this).text() || ''
  })

  return obj
}

const isGameOver = function() {
    const state = getBoardState()
    const matches = ['XXX', 'OOO']
    const rows = [
      state.r0c0 + state.r0c1 + state.r0c2,
      state.r1c0 + state.r1c1 + state.r1c2,
      state.r2c0 + state.r2c1 + state.r2c2,
      state.r0c0 + state.r1c0 + state.r2c0,
      state.r0c1 + state.r1c1 + state.r2c1,
      state.r0c2 + state.r1c2 + state.r2c2,
      state.r0c0 + state.r1c1 + state.r2c2,
      state.r0c2 + state.r1c1 + state.r2c0
    ]

    for (let i = 0; i < rows.length; i++) {
        if (rows[i] === matches[0] || rows[i] === matches[1]) {
            return true
        }
    }

    return false
}

const renderTurnMessage = function() {
    if (!myTurn) {
        $('.game__info').text('Ход вашего опонента')
        $('.game__boards .game__board').attr('disabled', true)
    } else {
        $('.game__info').text('Ваш ход.')
        $('.game__boards .game__board').removeAttr('disabled')
    }
}

const makeMove = function(e) {
    if (!myTurn) {
        return
    }

    if ($(this).text().length) {
        return
    }

    socket.emit('make.move', {
        symbol: symbol,
        position: $(this).attr('id')
    })
}

socket.on('move.made', function(data) {
    $('#' + data.position).text(data.symbol)
    myTurn = data.symbol !== symbol

    if (!isGameOver()) {
        renderTurnMessage()
    } else {
        if (myTurn) {
            $('.game__info').text('Вы проиграли.')
        } else {
            $('.game__info').text('Вы победили!')
        }

        $('.game__boards .game__board').attr('disabled', true)
    }
})


socket.on('game.begin', function(data) {
    symbol = data.symbol
    myTurn = symbol === 'X'
    renderTurnMessage()
})

socket.on('opponent.left', function() {
    $('.game__info').text('Ваш опонент покинул игру.')
    $('.game__boards .game__board').attr('disabled', true)
})

$(function() {
  $('.game__boards .game__board').attr('disabled', true)
  $('.game__boards > .game__board').on('click', makeMove)
})