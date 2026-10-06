using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using DataAcess.Entity;

namespace ShoesRepository.GenreicRepo
{
    public interface IGenericRepository<TEntity> where TEntity : class
    {
        TEntity GetById(int? id);
        IEnumerable<TEntity> GetAll();
        IEnumerable<TEntity> Find(Expression<Func<TEntity, bool>> predicate,
                               params Expression<Func<TEntity, object>>[] includeProperties);
         Task<TEntity> Add(TEntity entity);
        Task AddRangeAsync(List<TEntity> entities);
        void Update(TEntity entity);
        void Remove(TEntity entity);
        Task<IEnumerable<TEntity>> GetAllWithIncludesAsync(params Expression<Func<TEntity, object>>[] includeProperties);
        Task<TEntity> GetByIdAsync(int id, params Expression<Func<TEntity, object>>[] includes);
        Task<TEntity> GetByIdAsync(string id, params Expression<Func<TEntity, object>>[] includes);
    }
}
