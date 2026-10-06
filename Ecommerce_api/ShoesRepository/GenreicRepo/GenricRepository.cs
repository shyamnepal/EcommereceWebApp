using DataAcess.Entity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ShoesRepository.GenreicRepo
{
    public class GenricRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
    {
        private readonly ShoesEcommerceContext _context;
        public GenricRepository(ShoesEcommerceContext context)
        {
            _context = context;
            
        }
        public async Task<TEntity> Add(TEntity entity)
        {
            // use the async overload, though AddAsync isn’t truly async for relational providers
            await _context.Set<TEntity>().AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task AddRangeAsync(List<TEntity> entities)
        {
            try
            {
                 _context.Set<TEntity>().AddRange(entities);
                 _context.SaveChanges();
            
            }
            catch (Exception ex)
            {
                // Log the exception (consider using a logging framework)
                // Handle the exception as needed (e.g., rethrow, return a result, etc.)
                throw;
            }
        }

        public IEnumerable<TEntity> Find(Expression<Func<TEntity, bool>> predicate,
                                    params Expression<Func<TEntity, object>>[] includeProperties)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>().Where(predicate);

            foreach (var includeProperty in includeProperties)
            {
                query = query.Include(includeProperty);
            }

            return query.ToList();
        }

        public IEnumerable<TEntity> GetAll()
        {
            return _context.Set<TEntity>().ToList();
        }

        public TEntity GetById(int? id)
        {
            return _context.Set<TEntity>().Find(id);
        }
        public TEntity GetById(string id)
        {
            return _context.Set<TEntity>().Find(id);
        }

        public void Remove(TEntity entity)
        {
            _context.Set<TEntity>().Remove(entity);
            _context.SaveChanges();
        }

        public void Update(TEntity entity)
        {
            var entry = _context.Entry(entity);
            if (entry.State == EntityState.Detached)
            {
                _context.Set<TEntity>().Attach(entity);
                entry.State = EntityState.Modified;
            }
            _context.SaveChanges();
        }
        // Generic method to handle eager loading
        public async Task<IEnumerable<TEntity>> GetAllWithIncludesAsync(params Expression<Func<TEntity, object>>[] includeProperties)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>();

            // Apply Include for eager loading
            foreach (var includeProperty in includeProperties)
            {
                query = query.Include(includeProperty);
            }

            return await query.ToListAsync();


        }
        public async Task<TEntity> GetByIdAsync(int id, params Expression<Func<TEntity, object>>[] includes)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>();

            // Apply eager loading for included entities
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            // Get primary key property dynamically
            var keyProperty = typeof(TEntity).GetProperties()
                .FirstOrDefault(p => p.GetCustomAttributes(typeof(KeyAttribute), true).Any() ||
                                     p.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) ||
                                     p.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));

            if (keyProperty == null)
            {
                throw new Exception($"No primary key found for {typeof(TEntity).Name}");
            }

            string keyName = keyProperty.Name;

            // Use dynamic key lookup
            return await query.FirstOrDefaultAsync(e => EF.Property<int>(e, keyName) == id);
        }

        public async Task<TEntity> GetByIdAsync(string id, params Expression<Func<TEntity, object>>[] includes)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>();

            // Apply eager loading for included entities
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            // Get primary key property dynamically
            var keyProperty = typeof(TEntity).GetProperties()
                .FirstOrDefault(p => p.GetCustomAttributes(typeof(KeyAttribute), true).Any() ||
                                     p.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) ||
                                     p.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));

            if (keyProperty == null)
            {
                throw new Exception($"No primary key found for {typeof(TEntity).Name}");
            }

            string keyName = keyProperty.Name;

            // Use dynamic key lookup
            return await query.FirstOrDefaultAsync(e => EF.Property<string>(e, keyName) == id);
        }


    }
}
