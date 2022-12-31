import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layouts/Main'

import ErrorPage from '../pages/ErrorPage'
import Loading from '../components/Loading'

const LoadingPage = () => {
  return (
    <div className='my-6'>
      <Loading />
    </div>
  )
}

const ExplorePage = lazy(() => import('../pages/ExplorePage'))
const FavouritesPage = lazy(() => import('../pages/FavouritesPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const TopicPage = lazy(() => import('../pages/TopicPage'))
const SubtopicPage = lazy(() => import('../pages/SubtopicPage'))
const TestPage = lazy(() => import('../pages/TestPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        handle: 'explore',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <ExplorePage />
          </Suspense>
        )
      },
      {
        path: 'topic/:topicId',
        handle: 'mainTopic',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <TopicPage />
          </Suspense>
        )
      },
      {
        path: 'topic/:topicId/:subtopicId',
        handle: 'subTopic',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <SubtopicPage />
          </Suspense>
        )
      },
      {
        path: 'favourites',
        handle: 'favourites',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <FavouritesPage />
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
                <ProfilePage />
              </Suspense>
            )
          },
          {
            path: ':address',
            element: (
              <Suspense fallback={<LoadingPage />}>
                <ProfilePage />
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
            <TestPage />
          </Suspense>
        )
      }
    ]
  }
])

export default router
