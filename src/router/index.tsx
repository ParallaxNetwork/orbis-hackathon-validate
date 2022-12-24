import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layouts/Main'

import Error from '../pages/Error'
import Loading from '../components/Loading'

const LoadingPage = () => {
  return (
    <div className='my-6'>
      <Loading />
    </div>
  )
}

const Explore = lazy(() => import('../pages/Explore'))
const Favourites = lazy(() => import('../pages/Favourites'))
const Profile = lazy(() => import('../pages/Profile'))
const Test = lazy(() => import('../pages/Test'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <Error />,
    children: [
      {
        path: '',
        handle: 'explore',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <Explore />
          </Suspense>
        )
      },
      {
        path: 'favourites',
        handle: 'favourites',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <Favourites />
          </Suspense>
        )
      },
      {
        path: 'profile',
        handle: 'profile',
        children: [
          {
            path: '',
            element: (
              <Suspense fallback={<LoadingPage />}>
                <Profile />
              </Suspense>
            )
          },
          {
            path: ':address',
            element: (
              <Suspense fallback={<LoadingPage />}>
                <Profile />
              </Suspense>
            )
          }
        ]
      },
      {
        path: 'test',
        handle: 'test',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <Test />
          </Suspense>
        )
      }
    ]
  }
])

export default router
