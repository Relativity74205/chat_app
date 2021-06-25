document.addEventListener('DOMContentLoaded', () => {

    if (localStorage.getItem('user_name')) {
        let user_name = localStorage.getItem('user_name')
        document.querySelector('#user_name').value = user_name
    }

    document.querySelector('button').onclick = () => {
        let user_name = document.querySelector('#user_name').value
        localStorage.setItem('user_name', user_name);
    }

});