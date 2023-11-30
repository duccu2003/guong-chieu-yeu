import { useEffect, useMemo, useState } from 'react';
import Draggable from 'react-draggable';
import images from './images';

function App() {
    const windowId = useMemo(() => Math.random(), [])
    const [loading, setLoading] = useState(true) // load images effect
    const [position, setPosition] = useState({ x: window.innerWidth / 4, y: 0 }) // relative image's postion
    const [imageId, setImageId] = useState(0) // image id in set
    const image1Url = images[imageId].censor // 
    const image2Url = images[imageId].uncensor
    const [index, setIndex] = useState(0) // 0: original window, 1: base image window, 2: uncensor image window

    const bc = useMemo(() => new BroadcastChannel('biya'), []);

    const handleOpenNewWindow = () => {
        // manual open is also ok 
        if (index !== 2) {
            window.open(window.location.href, '_blank',
                index === 0 ?
                `toolbar=no, menubar=no, location=yes,height=${window.innerHeight},width=${window.innerWidth},scrollbars=no,status=yes` :
                `toolbar=no, menubar=no, location=yes,height=${window.innerHeight / 4},width=${window.innerWidth / 4},scrollbars=no,status=yes`
            )
        } else {
            window.close()
        }
    }

    // update and emit new position
    const updateNewPosition = ({ x, y }) => {
        bc.postMessage({ type: 'update_position', value: { x, y, windowX: window.screenX, windowY: window.screenY } })
        setPosition({ x, y })
    }

    useEffect(() => {
        bc.onmessage = (event) => {
            switch (event.data.type) {
                case 'new_tab':
                    if (index === 1) {
                        bc.postMessage({ type: 'index_2', value: event.data.value, })
                        updateNewPosition(position)
                        bc.postMessage({ type: 'image_id', value: imageId })
                    } else {
                        bc.postMessage({ type: 'index_1', value: event.data.value, })
                    }
                    break;
                case 'index_1':
                    if (event.data.value === windowId) {
                        setIndex(1)
                        document.title = images[imageId].title
                    }
                    break;
                case 'index_2':
                    if (event.data.value === windowId) {
                        setIndex(2)
                        document.title = "Gương thần"
                    }
                    break;
                case 'update_position': // sync image's position accross window
                    const { x, y, windowX, windowY } = event.data.value
                    const absoluteX = windowX + x
                    const absoluteY = windowY + y
                    setPosition({ x: absoluteX - window.screenX, y: absoluteY - window.screenY })
                    break;
                case 'image_id': // sync image id
                    setImageId(event.data.value)
                    break;
                default:
                    break;
            }
        };

        return () => bc.onmessage = null
    }, [bc, windowId, index, imageId, position])

    // detect window moved
    useEffect(() => {
        var oldX = window.screenX,
            oldY = window.screenY;

        function update() {
            const deltaX = -window.screenX + oldX
            const deltaY = -window.screenY + oldY
            if (deltaX !== 0 || deltaY !== 0) {
                setPosition((prevPosition) => {
                    const newPosition = ({ x: prevPosition.x + deltaX, y: prevPosition.y + deltaY })
                    console.log(prevPosition, newPosition);
                    return newPosition
                })
            }
            oldX -= deltaX;
            oldY -= deltaY;
            requestAnimationFrame(update);
        }

        const interval = requestAnimationFrame(update);

        return () => cancelAnimationFrame(interval)
    }, [setPosition])

    // boarding case new_tab event
    useEffect(() => {
        bc.postMessage({ type: 'new_tab', value: windowId });
    }, [windowId])

    // loading images effect
    useEffect(() => {
        setLoading(true)
        Promise.all(
            Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(
                resolve => { img.onload = img.onerror = resolve; }
            ))).then(() => {
            setLoading(false)
        });
    }, [imageId])

    return ( <
        >
        {
            loading && index !== 0 &&
            <
            div class = "fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center" >
            <
            div class = "loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" > < /div> <
            h2 class = "text-center text-white text-xl font-semibold" > Đang tải... < /h2> <
            p class = "w-1/3 text-center text-white" > Đừng lóng,
            chờ 1 xíu là tải xong... < /p> < /
            div >
        } <
        div className = "App w-[100vw] h-[100vh] bg-gray-50 dark:bg-gray-800 pt-2" >
        <
        div className = 'container mx-auto text-center pt-2 px-1' >

        {
            index === 0 ?
            <
            >
            <
            h1 className = "text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white uppercase mb-2 custom-heading" > Kính Chiếu Yêu < /h1> <
            / > :
                <
                div className = 'flex flex-col gap-y-2 mb-2' >
                <
                label
            for = "images"
            className = "block text-sm font-medium text-gray-900 dark:text-white" > Chọn ảnh < /label> <
            select
            id = "images"
            className = 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            value = { imageId }
            onChange = {
                (event) => {
                    console.log("Change Event!")
                    setImageId(event.target.value)
                    bc.postMessage({ type: 'image_id', value: event.target.value })
                }
            } > {
                images.map((image, index) => < option value = { index } > { image.title } < /option>)
                } <
                /select> < /
                div >
            } <
            div >
            <
            button
            className = 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
            onClick = { handleOpenNewWindow } > {
                index === 0 ? "Mở ảnh" : index === 1 ? "Mở gương thần" : "Đóng gương thần"
            } <
            /button> < /
            div > <
            /div> {
            index !== 0 &&
            <
            Draggable
            position = { position }
            onDrag = {
                (event, data) => {
                    updateNewPosition({ x: data.x, y: data.y });
                }
            } >
            <
            img className = 'cursor-move max-w-[900px]'
            src = { index === 2 ? image2Url : image1Url }
            draggable = "false" / >
            <
            /Draggable>
        } <
        /div> < / >
    );
}

export default App;